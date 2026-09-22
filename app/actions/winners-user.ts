"use server"

import { requireActiveSubscription, requireUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { canTransition, validateProofFile, VerificationStatus } from "@/lib/winners"
import path from "path"
import { revalidatePath } from "next/cache"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

export async function uploadProof(formData: FormData) {
  const { profile } = await requireUser() // Base user auth check

  const winnerId = formData.get("winner_id") as string
  const file = formData.get("file") as File

  if (!winnerId || !file) {
    return { error: "Missing winner ID or file." }
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Validate the file
  const validation = validateProofFile(buffer)
  if (!validation.valid) {
    return { error: validation.error }
  }

  // Fetch the winner row to check ownership and state
  const { data: winner, error: winnerError } = await supabaseAdmin
    .from("winners")
    .select("*")
    .eq("id", winnerId)
    .single()

  if (winnerError || !winner) {
    return { error: "Winner record not found." }
  }

  // Verify ownership
  if (winner.user_id !== profile.id) {
    return { error: "Unauthorized access to winner record." }
  }

  // Verify transition (current state must be awaiting_proof or rejected)
  const currentStatus = winner.verification_status as VerificationStatus
  if (!canTransition(currentStatus, "submitted")) {
    return { error: `Cannot upload proof while status is '${currentStatus}'.` }
  }

  // Determine file extension
  let ext = path.extname(file.name).toLowerCase()
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    return { error: "Unsupported file extension." }
  }
  
  // Storage path: {user_id}/{winner_id}/{timestamp}{ext}
  const timestamp = Date.now()
  const newProofPath = `${profile.id}/${winner.id}/${timestamp}${ext}`

  // Upload to storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from("winner-proofs")
    .upload(newProofPath, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    console.error("Storage upload error:", uploadError)
    return { error: "Failed to upload file to storage." }
  }

  // Conditional DB update
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("winners")
    .update({
      proof_path: newProofPath,
      proof_uploaded_at: new Date().toISOString(),
      verification_status: "submitted",
      updated_at: new Date().toISOString()
    })
    .eq("id", winner.id)
    .in("verification_status", ["awaiting_proof", "rejected"]) // prevent race conditions
    .select()
    .single()

  if (updateError || !updated) {
    // If DB update failed, clean up the newly uploaded file
    await supabaseAdmin.storage.from("winner-proofs").remove([newProofPath])
    return { error: "Failed to update record. Please try again." }
  }

  // If DB update succeeded and this was a re-upload (previous proof existed), delete the old proof
  if (winner.proof_path && winner.proof_path !== newProofPath) {
    const { error: deleteOldError } = await supabaseAdmin.storage
      .from("winner-proofs")
      .remove([winner.proof_path])
    
    if (deleteOldError) {
      console.error("Failed to clean up old proof file:", deleteOldError)
      // Non-fatal, just log it
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/winnings")
  revalidatePath("/admin/winners")

  return { success: true }
}

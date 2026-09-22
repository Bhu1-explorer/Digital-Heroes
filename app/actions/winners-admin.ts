"use server"

import { requireAdmin } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { canTransition, VerificationStatus } from "@/lib/winners"
import { z } from "zod"

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

const rejectSchema = z.object({
  winnerId: z.string().uuid(),
  adminNote: z.string().min(5, "Note must be at least 5 characters.").max(500, "Note too long.")
})

export async function getProofSignedUrl(winnerId: string) {
  await requireAdmin()

  const { data: winner, error: winnerError } = await supabaseAdmin
    .from("winners")
    .select("proof_path")
    .eq("id", winnerId)
    .single()

  if (winnerError || !winner || !winner.proof_path) {
    return { error: "Proof not found." }
  }

  const { data, error } = await supabaseAdmin.storage
    .from("winner-proofs")
    .createSignedUrl(winner.proof_path, 60) // 60 seconds

  if (error || !data) {
    console.error("Failed to generate signed URL:", error)
    return { error: "Failed to generate access URL." }
  }

  return { url: data.signedUrl }
}

export async function approveWinner(formData: FormData) {
  const { profile } = await requireAdmin()
  const winnerId = formData.get("winner_id") as string

  if (!winnerId) return { error: "Missing winner ID" }

  const { data: winner } = await supabaseAdmin
    .from("winners")
    .select("verification_status")
    .eq("id", winnerId)
    .single()

  if (!winner) return { error: "Winner not found." }

  if (!canTransition(winner.verification_status as VerificationStatus, "approved")) {
    return { error: `Cannot approve winner from state '${winner.verification_status}'` }
  }

  const { data: updated, error } = await supabaseAdmin
    .from("winners")
    .update({
      verification_status: "approved",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", winnerId)
    .eq("verification_status", "submitted") // conditional update
    .select()
    .single()

  if (error || !updated) {
    return { error: "Failed to approve winner or state changed." }
  }

  return { success: true }
}

export async function rejectWinner(formData: FormData) {
  const { profile } = await requireAdmin()
  
  const parsed = rejectSchema.safeParse({
    winnerId: formData.get("winner_id"),
    adminNote: formData.get("admin_note")
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { winnerId, adminNote } = parsed.data

  const { data: winner } = await supabaseAdmin
    .from("winners")
    .select("verification_status")
    .eq("id", winnerId)
    .single()

  if (!winner) return { error: "Winner not found." }

  if (!canTransition(winner.verification_status as VerificationStatus, "rejected")) {
    return { error: `Cannot reject winner from state '${winner.verification_status}'` }
  }

  const { data: updated, error } = await supabaseAdmin
    .from("winners")
    .update({
      verification_status: "rejected",
      admin_note: adminNote,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", winnerId)
    .eq("verification_status", "submitted") // conditional update
    .select()
    .single()

  if (error || !updated) {
    return { error: "Failed to reject winner or state changed." }
  }

  return { success: true }
}

export async function markWinnerPaid(formData: FormData) {
  await requireAdmin()
  const winnerId = formData.get("winner_id") as string

  if (!winnerId) return { error: "Missing winner ID" }

  const { data: winner } = await supabaseAdmin
    .from("winners")
    .select("verification_status, payment_status")
    .eq("id", winnerId)
    .single()

  if (!winner) return { error: "Winner not found." }

  if (winner.payment_status === "paid") {
    return { error: "Winner is already paid." }
  }

  if (winner.verification_status !== "approved") {
    return { error: "Cannot pay an unapproved winner." }
  }

  const { data: updated, error } = await supabaseAdmin
    .from("winners")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", winnerId)
    .eq("verification_status", "approved")
    .eq("payment_status", "pending")
    .select()
    .single()

  if (error || !updated) {
    return { error: "Failed to mark paid or state changed." }
  }

  return { success: true }
}

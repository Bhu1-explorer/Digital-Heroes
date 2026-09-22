"use server"

import { requireAdmin } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
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

export async function toggleUserRole(userId: string) {
  const { profile: currentAdmin } = await requireAdmin()

  if (userId === currentAdmin.id) {
    return { error: "You cannot change your own role." }
  }

  const { data: userProfile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (fetchError || !userProfile) {
    return { error: "User not found." }
  }

  const newRole = userProfile.role === "admin" ? "user" : "admin"

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)

  if (updateError) {
    return { error: "Failed to update role." }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

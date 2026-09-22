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

export async function overrideSubscriptionStatus(subscriptionId: string, forceActive: boolean) {
  const { profile: currentAdmin } = await requireAdmin()

  const { data: sub, error: fetchError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status")
    .eq("id", subscriptionId)
    .single()

  if (fetchError || !sub) {
    return { error: "Subscription not found." }
  }

  const newStatus = forceActive ? "active" : "canceled"
  const updates: any = {
    status: newStatus,
    admin_override_by: currentAdmin.id,
    admin_override_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (forceActive) {
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)
    updates.current_period_end = nextMonth.toISOString()
  }

  const { error: updateError } = await supabaseAdmin
    .from("subscriptions")
    .update(updates)
    .eq("id", subscriptionId)

  if (updateError) {
    console.error(updateError)
    return { error: "Failed to override subscription status." }
  }

  revalidatePath("/admin/subscriptions")
  revalidatePath("/admin/users")
  return { success: true }
}

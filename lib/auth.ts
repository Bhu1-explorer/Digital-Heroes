import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, charity_id, charity_percent")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  return { user, profile }
}

export async function requireAdmin() {
  const { user, profile } = await requireUser()
  
  if (profile.role !== "admin") {
    redirect("/dashboard")
  }
  
  return { user, profile }
}

export async function requireActiveSubscription() {
  const { user, profile } = await requireUser()

  // Admins bypass subscription checks
  if (profile.role === "admin") {
    return { user, profile, subscription: null }
  }

  const supabase = await createClient()
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // "Active" means status active, or canceled with current_period_end in the future
  const isActive = subscription?.status === "active" || 
    (subscription?.status === "canceled" && subscription.current_period_end && new Date(subscription.current_period_end) > new Date())

  if (!subscription || !isActive) {
    redirect("/subscribe")
  }

  return { user, profile, subscription }
}

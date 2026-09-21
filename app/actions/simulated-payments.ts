"use server"

import { requireUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export async function processSimulatedPayment(formData: FormData) {
  if (process.env.ALLOW_SIMULATED_PAYMENTS !== "true") {
    throw new Error("Simulated payments are disabled")
  }

  // Get user from session, NEVER from input
  const { user } = await requireUser()
  
  const mode = formData.get("mode") as string || "subscription"
  const successUrl = formData.get("successUrl") as string

  // Use service role to bypass RLS for subscriptions and donations tables
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

  if (mode === "payment") {
    const charityId = formData.get("charityId") as string
    const amountStr = formData.get("price") as string
    
    if (charityId && amountStr) {
      await supabaseAdmin.from("donations").insert({
        user_id: user.id,
        charity_id: charityId,
        amount: parseInt(amountStr, 10),
        status: "completed"
      })
    }
  } else {
    // Calculate a future date for current_period_end (e.g., 1 month or 1 year)
    const planType = formData.get("planType") as string
    const endDate = new Date()
    if (planType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        status: "active",
        plan_type: planType,
        current_period_end: endDate.toISOString(),
        stripe_customer_id: `sim_cus_${user.id.substring(0, 8)}`,
        stripe_subscription_id: `sim_sub_${Date.now()}`,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (error) {
      console.error("Simulation error:", error)
      throw new Error("Failed to process simulated payment")
    }
  }

  redirect(successUrl)
}

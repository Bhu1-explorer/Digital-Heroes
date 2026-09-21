"use server"

import { requireUser } from "@/lib/auth"
import { getPaymentProvider } from "@/lib/payments"
import { redirect } from "next/navigation"

export async function createCheckoutSession(formData: FormData) {
  const { user } = await requireUser()
  const provider = getPaymentProvider()

  const planType = formData.get("planType") as "monthly" | "yearly"
  const price = planType === "monthly" ? 499 : 4999 // Fallback values, usually loaded from settings

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const session = await provider.createCheckoutSession(
    user.id,
    user.email || "",
    planType,
    price,
    `${siteUrl}/dashboard?success=true`,
    `${siteUrl}/subscribe?canceled=true`
  )

  redirect(session.url)
}

export async function createPortalSession() {
  const { user } = await requireUser()
  const provider = getPaymentProvider()
  
  // We need to look up the stripe_customer_id
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  const customerId = sub?.stripe_customer_id || user.id // Fallback for simulation
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const session = await provider.createCustomerPortal(
    customerId,
    `${siteUrl}/dashboard/settings`
  )

  redirect(session.url)
}

"use server"

import { requireUser } from "@/lib/auth"
import { getPaymentProvider } from "@/lib/payments"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const donationSchema = z.object({
  charityId: z.string().min(1, "Invalid charity"),
  amount: z.coerce.number().min(1, "Minimum $1 donation").max(10000, "Maximum $10,000 donation"),
})

export async function createDonationSession(formData: FormData) {
  let user, userEmail
  try {
    const sessionUser = await requireUser()
    user = sessionUser.user
    userEmail = user.email
  } catch {
    // Guest donation fallback if they aren't logged in
    user = null
    userEmail = undefined
  }

  const data = Object.fromEntries(formData.entries())
  
  const parsed = donationSchema.safeParse({
    charityId: data.charityId,
    amount: data.amount,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { charityId, amount } = parsed.data

  const supabase = await createClient()
  const { data: charity } = await supabase
    .from("charities")
    .select("active")
    .eq("id", charityId)
    .single()

  if (!charity || !charity.active) {
    return { error: "Charity is not active or does not exist." }
  }

  const provider = getPaymentProvider()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  
  // Convert dollars to cents
  const amountCents = Math.round(amount * 100)

  const session = await provider.createDonationSession(
    charityId,
    amountCents,
    `${siteUrl}/charities?success=true`,
    `${siteUrl}/charities/${charityId}?canceled=true`,
    user?.id,
    userEmail
  )

  redirect(session.url)
}

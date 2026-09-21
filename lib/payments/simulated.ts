import { PaymentProvider, CheckoutSessionResult } from "./types"

export class SimulatedProvider implements PaymentProvider {
  async createCheckoutSession(
    userId: string,
    userEmail: string,
    planType: "monthly" | "yearly",
    priceAmount: number,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResult> {
    // Generate a mock checkout URL with data in search params to reconstruct it in our simulated UI
    // We don't use URL params to process the final payment (security), 
    // but we use them to pass context to the mock UI.
    const url = new URL("/simulated-checkout", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    url.searchParams.set("planType", planType)
    url.searchParams.set("price", priceAmount.toString())
    url.searchParams.set("successUrl", successUrl)
    url.searchParams.set("cancelUrl", cancelUrl)
    
    return { url: url.toString() }
  }

  async createCustomerPortal(customerId: string, returnUrl: string): Promise<{ url: string }> {
    // For simulated portal, we just return to the dashboard where they can click "Cancel" via a simulated action
    const url = new URL("/simulated-portal", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    url.searchParams.set("returnUrl", returnUrl)
    
    return { url: url.toString() }
  }

  async createDonationSession(
    charityId: string,
    amount: number,
    successUrl: string,
    cancelUrl: string,
    userId?: string,
    userEmail?: string
  ): Promise<CheckoutSessionResult> {
    const url = new URL("/simulated-checkout", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    url.searchParams.set("mode", "payment")
    url.searchParams.set("price", amount.toString())
    url.searchParams.set("charityId", charityId)
    url.searchParams.set("successUrl", successUrl)
    url.searchParams.set("cancelUrl", cancelUrl)
    
    return { url: url.toString() }
  }
}

export interface CheckoutSessionResult {
  url: string
}

export interface PaymentProvider {
  createCheckoutSession(
    userId: string, 
    userEmail: string, 
    planType: "monthly" | "yearly", 
    priceId: number, // Using price amount for simplicity in simulated, Stripe will use ID
    successUrl: string, 
    cancelUrl: string
  ): Promise<CheckoutSessionResult>

  createCustomerPortal(
    customerId: string, 
    returnUrl: string
  ): Promise<{ url: string }>

  createDonationSession(
    charityId: string,
    amount: number, // minor units (cents)
    successUrl: string,
    cancelUrl: string,
    userId?: string, // optional for guest donations
    userEmail?: string
  ): Promise<CheckoutSessionResult>
}

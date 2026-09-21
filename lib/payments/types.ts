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
}

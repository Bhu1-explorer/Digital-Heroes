import Stripe from "stripe"
import { PaymentProvider, CheckoutSessionResult } from "./types"

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY")
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {})
  }

  async createCheckoutSession(
    userId: string,
    userEmail: string,
    planType: "monthly" | "yearly",
    priceAmount: number, // In production, we'd look up a Stripe Price ID instead of passing amount
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResult> {
    // For this implementation without fixed Stripe Price IDs in env vars, 
    // we use price_data to create inline prices for testing.
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Digital Heroes - ${planType === "monthly" ? "Monthly" : "Yearly"} Plan`,
            },
            unit_amount: priceAmount,
            recurring: {
              interval: planType === "monthly" ? "month" : "year",
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planType,
      }
    })

    if (!session.url) {
      throw new Error("Failed to create Stripe session")
    }

    return { url: session.url }
  }

  async createCustomerPortal(customerId: string, returnUrl: string): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  }

  async createDonationSession(
    charityId: string,
    amount: number, // minor units (cents)
    successUrl: string,
    cancelUrl: string,
    userId?: string,
    userEmail?: string
  ): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Charity Donation",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "donation",
        charityId,
        userId: userId || "",
        amount: amount.toString()
      }
    })

    if (!session.url) {
      throw new Error("Failed to create Stripe session")
    }

    return { url: session.url }
  }
}

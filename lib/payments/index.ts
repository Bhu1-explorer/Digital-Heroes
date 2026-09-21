import { PaymentProvider } from "./types"
import { StripeProvider } from "./stripe"
import { SimulatedProvider } from "./simulated"

export function getPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripeProvider()
  }
  
  if (process.env.ALLOW_SIMULATED_PAYMENTS === "true") {
    return new SimulatedProvider()
  }

  throw new Error("No payment provider configured. Set STRIPE_SECRET_KEY or ALLOW_SIMULATED_PAYMENTS=true")
}

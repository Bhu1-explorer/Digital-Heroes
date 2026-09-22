import { requireUser } from "@/lib/auth"
import { createCheckoutSession } from "@/app/actions/payments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Ticket } from "@/components/illustrations"
export default async function SubscribePage() {
  const { profile } = await requireUser()

  // In a real app we'd fetch prices from settings/Stripe
  const monthlyPrice = 4.99
  const yearlyPrice = 49.99

  const hasStripeKeys = !!process.env.STRIPE_SECRET_KEY

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 animate-slide-in">
        <div className="text-center bg-card border-2 border-border p-8 rounded-3xl shadow-flat max-w-2xl mx-auto">
          <h1 className="text-4xl font-heading font-bold">Choose Your Plan</h1>
          <p className="mt-2 text-muted-foreground font-medium text-lg">
            Hi {profile.full_name}, subscribe to start playing and supporting your charity.
          </p>
          {!hasStripeKeys && (
            <div className="mt-4 inline-block bg-accent/20 text-accent-foreground font-bold px-4 py-2 rounded-xl border-2 border-accent">
              Running in Demo Mode (Simulated Checkout)
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Monthly Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Monthly</CardTitle>
              <CardDescription>Billed every month</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="font-display text-5xl mb-6">${monthlyPrice}</div>
              <ul className="space-y-3 font-medium">
                <li className="flex items-center gap-2">✓ Full access to score tracking</li>
                <li className="flex items-center gap-2">✓ Enter monthly charity draws</li>
                <li className="flex items-center gap-2">✓ Support your chosen charity</li>
              </ul>
            </CardContent>
            <CardFooter>
              <form action={createCheckoutSession} className="w-full">
                <input type="hidden" name="planType" value="monthly" />
                <Button type="submit" size="lg" className="w-full">Subscribe Monthly</Button>
              </form>
            </CardFooter>
          </Card>

          {/* Yearly Plan */}
          <Card className="flex flex-col border-primary ring-4 ring-primary/20 relative">
            <div className="absolute -top-4 right-4 bg-accent text-accent-foreground font-bold px-3 py-1 rounded-full border-2 border-border shadow-flat-sm text-sm">
              Save 16%
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Yearly</CardTitle>
              <CardDescription>Billed annually</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="font-display text-5xl mb-6">${yearlyPrice}</div>
              <ul className="space-y-3 font-medium">
                <li className="flex items-center gap-2">✓ Full access to score tracking</li>
                <li className="flex items-center gap-2">✓ Enter monthly charity draws</li>
                <li className="flex items-center gap-2">✓ Support your chosen charity</li>
                <li className="flex items-center gap-2 font-bold text-success">✓ 2 months free</li>
              </ul>
              <div className="mt-8 flex justify-center opacity-50">
                <Ticket className="w-16 h-16" />
              </div>
            </CardContent>
            <CardFooter>
              <form action={createCheckoutSession} className="w-full">
                <input type="hidden" name="planType" value="yearly" />
                <Button type="submit" size="lg" variant="default" className="w-full bg-primary hover:bg-primary/90">
                  Subscribe Yearly
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

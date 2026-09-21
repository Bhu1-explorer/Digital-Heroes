import { requireUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { processSimulatedPayment } from "@/app/actions/simulated-payments"

export default async function SimulatedCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  if (process.env.ALLOW_SIMULATED_PAYMENTS !== "true") {
    redirect("/")
  }

  const { user } = await requireUser()
  const resolvedSearchParams = await searchParams
  
  const planType = resolvedSearchParams.planType as string
  const price = resolvedSearchParams.price as string
  const successUrl = resolvedSearchParams.successUrl as string
  const cancelUrl = resolvedSearchParams.cancelUrl as string

  if (!planType || !price || !successUrl || !cancelUrl) {
    redirect("/subscribe")
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-2xl relative overflow-visible">
        <div className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground font-bold px-3 py-1 rounded-full border-2 border-border shadow-flat-sm text-xs rotate-12 z-10">
          Demo Mode
        </div>
        <CardHeader className="bg-primary text-primary-foreground rounded-t-xl border-b-2 border-border pb-6 pt-6">
          <CardTitle className="text-2xl">Simulated Checkout</CardTitle>
          <CardDescription className="text-primary-foreground/80 font-medium">
            Test environment for {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4 font-medium">
            <div className="flex justify-between border-b-2 border-border/10 pb-4">
              <span>Plan</span>
              <span className="font-bold capitalize">{planType}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span>Total due today</span>
              <span className="font-display text-2xl">${(Number(price) / 100).toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Clicking "Simulate Success" will process a fake payment and activate your subscription using the current session user.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <form className="flex-1" action={processSimulatedPayment}>
            <input type="hidden" name="planType" value={planType} />
            <input type="hidden" name="successUrl" value={successUrl} />
            <Button type="submit" className="w-full bg-success text-success-foreground hover:bg-success/90">
              Simulate Success
            </Button>
          </form>
          <Button variant="outline" className="flex-1" asChild>
            <a href={cancelUrl}>Cancel</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

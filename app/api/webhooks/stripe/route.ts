import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  function getSubscriptionId(obj: any): string | undefined {
    const sub = obj.subscription || obj.subscription_details?.subscription || obj.parent?.subscription_details?.subscription;
    if (typeof sub === 'string') return sub;
    if (sub && typeof sub === 'object' && sub.id) return sub.id;
    return undefined;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!stripeSecret || !endpointSecret) {
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecret, {})

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    if (!sig) throw new Error("No signature")
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error("Webhook Error:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId || null
        
        if (session.mode === "payment") {
          // Process one-off donation
          const charityId = session.metadata?.charityId
          const amountStr = session.metadata?.amount
          
          if (charityId && amountStr) {
            await supabase.from("donations").insert({
              user_id: userId,
              charity_id: charityId,
              amount: parseInt(amountStr, 10),
              status: "completed"
            })
          }
        } else if (session.mode === "subscription") {
          // Process subscription setup
          const planType = session.metadata?.planType || "monthly"
          
          if (!userId) throw new Error("No userId found in subscription session")

          const subId = getSubscriptionId(session)
          if (subId) {
            const subscription = await stripe.subscriptions.retrieve(subId)
            const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end 
              ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
              : new Date((subscription as any).current_period_end * 1000).toISOString()

            await supabase
              .from("subscriptions")
              .upsert({
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                plan_type: planType,
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: subscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" })
          }
        }
        break
      }
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end 
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
          : new Date((subscription as any).current_period_end * 1000).toISOString()

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId = getSubscriptionId(invoice)
        if (subId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subId)
        }
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

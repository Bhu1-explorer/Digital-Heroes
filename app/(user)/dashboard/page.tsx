import { requireActiveSubscription } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ScoreManager } from "@/components/dashboard/score-manager"
import { HeartHands, CoinStack, Ticket } from "@/components/illustrations"
import { createPortalSession } from "@/app/actions/payments"

export default async function DashboardPage() {
  const { profile, subscription } = await requireActiveSubscription()
  const supabase = await createClient()
  
  // Fetch user's charity info
  const { data: charity } = await supabase
    .from("charities")
    .select("name")
    .eq("id", profile.charity_id)
    .single()

  // Fetch user's scores
  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", profile.id)
    .order("played_on", { ascending: false })

  const renewalDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : "N/A"
  
  const isCanceled = subscription?.cancel_at_period_end

  return (
    <div className="container mx-auto p-4 py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-1 font-medium">Welcome back, {profile.full_name}.</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Score Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 ring-4 ring-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Your Scores</CardTitle>
              <CardDescription className="text-base">
                Track your progress. We use your most recent 5 scores to calculate your draw entry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreManager initialScores={scores || []} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="size-6 text-primary" /> Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Ticket className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold">No draws yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your first entry will appear when the next draw is simulated.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CoinStack className="size-6 text-accent" /> Winnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CoinStack className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold">Nothing to show</h3>
                  <p className="text-sm text-muted-foreground mt-1">Winning matches and prize payouts will be listed here.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Status & Charity */}
        <div className="space-y-6">
          <Card className={isCanceled ? "border-destructive ring-4 ring-destructive/10" : "border-success ring-4 ring-success/10"}>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-full ${isCanceled ? 'bg-destructive' : 'bg-success'}`} />
                    <span className="font-bold capitalize">{subscription?.status || 'Active'}</span>
                    {isCanceled && <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Canceling</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {isCanceled ? "Ends On" : "Renews On"}
                  </div>
                  <div className="font-bold">{renewalDate}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <form action={createPortalSession} className="w-full">
                <Button type="submit" variant="outline" className="w-full">Manage Billing</Button>
              </form>
            </CardFooter>
          </Card>

          <Card className="bg-secondary/10 border-secondary ring-4 ring-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartHands className="size-6 text-secondary" /> Giving Back
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Supported Charity</div>
                  <div className="font-bold">{charity?.name || "Not Selected"}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Donation Rate</div>
                  <div className="font-display text-3xl text-secondary">{profile.charity_percent}%</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Of your subscription fee</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full bg-white">
                <Link href="/dashboard/settings">Change Settings</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

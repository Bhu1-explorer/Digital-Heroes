import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function Home() {
  const supabase = await createClient()

  // Fetch featured charities
  const { data: featuredCharities } = await supabase
    .from("charities")
    .select("id, name, slug, description, category")
    .eq("is_featured", true)
    .eq("active", true)
    .limit(3)

  // Fetch current jackpot (from the latest published draw's carry out)
  const { data: latestDraw } = await supabase
    .from("draws")
    .select("jackpot_carry_out")
    .eq("status", "published")
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentJackpot = latestDraw?.jackpot_carry_out || 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center p-4 py-20 bg-muted/30">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tight text-ink">
            Play Golf. <span className="text-primary block md:inline">Do Good.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Track your scores, enter monthly prize draws, and support your favorite charities with every round.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button size="lg" className="text-lg h-14 px-8" asChild>
              <Link href="/signup">Join the Club</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg h-14 px-8 bg-white" asChild>
              <Link href="/charities">View Charities</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 bg-white border-y-2 border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-heading font-bold mb-4">How the Draw Works</h2>
          <p className="text-lg text-muted-foreground font-medium mb-12 max-w-2xl mx-auto">
            Your 5 most recent golf scores become your entry into the monthly prize draw.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="border-2 border-ink p-6 rounded-2xl relative">
              <div className="absolute -top-4 -left-4 bg-secondary text-secondary-foreground font-bold size-8 rounded-full border-2 border-ink flex items-center justify-center">1</div>
              <h3 className="font-bold text-xl mb-2">Play & Log</h3>
              <p className="text-sm text-muted-foreground">Log your scores throughout the month. We keep your latest 5 distinct scores.</p>
            </div>
            <div className="border-2 border-ink p-6 rounded-2xl relative">
              <div className="absolute -top-4 -left-4 bg-primary text-primary-foreground font-bold size-8 rounded-full border-2 border-ink flex items-center justify-center">2</div>
              <h3 className="font-bold text-xl mb-2">The Draw</h3>
              <p className="text-sm text-muted-foreground">On the 1st of every month, 5 unique numbers (1-45) are drawn.</p>
            </div>
            <div className="border-2 border-ink p-6 rounded-2xl relative">
              <div className="absolute -top-4 -left-4 bg-success text-success-foreground font-bold size-8 rounded-full border-2 border-ink flex items-center justify-center">3</div>
              <h3 className="font-bold text-xl mb-2">Win Prizes</h3>
              <p className="text-sm text-muted-foreground">Match 3, 4, or all 5 numbers to win a share of the tier's prize pool!</p>
            </div>
          </div>

          <div className="bg-muted p-8 rounded-2xl border-2 border-ink text-left md:flex items-center justify-between gap-8">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Current Jackpot</h3>
              <p className="text-muted-foreground">
                If nobody matches 5 numbers, the top tier prize rolls over to the next month's jackpot.
              </p>
            </div>
            <div className="shrink-0 text-center">
              <div className="text-5xl font-display font-bold text-primary">
                ${(currentJackpot / 100).toFixed(2)}
              </div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">To be won</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">Featured Partners</h2>
            <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
              Choose who you play for. 10% or more of your subscription goes directly to the charity of your choice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredCharities?.map(charity => (
              <Link key={charity.id} href={`/charities/${charity.slug}`} className="block group">
                <Card className="h-full transition-all group-hover:shadow-flat group-hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-1 rounded-md">
                        {charity.category || "General"}
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors text-2xl">{charity.name}</CardTitle>
                    <CardDescription className="text-base mt-2 line-clamp-3">
                      {charity.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link href="/charities">See all charities</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

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

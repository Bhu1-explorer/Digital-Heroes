import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CharityImage } from "@/components/charities/charity-image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DonationForm } from "@/components/charities/donation-form"

export default async function CharityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Get current user and subscription safely without redirects
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  let subscription = null
  let isActive = false

  if (user) {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = p
    
    if (profile?.role === "admin") {
      isActive = true
    } else {
      const { data: s } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()
      subscription = s
      isActive = !!subscription && (
        subscription.status === "active" || 
        subscription.status === "trialing" ||
        (subscription.status === "canceled" && subscription.current_period_end && new Date(subscription.current_period_end) > new Date())
      )
    }
  }

  const { data: charity } = await supabase
    .from("charities")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!charity || !charity.active) {
    notFound()
  }

  // Get upcoming events
  const today = new Date().toISOString().split('T')[0]
  const { data: events } = await supabase
    .from("charity_events")
    .select("*")
    .eq("charity_id", charity.id)
    .gte("date", today)
    .order("date", { ascending: true })

  return (
    <div className="container mx-auto p-4 py-12 max-w-5xl space-y-12">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <CharityImage 
          id={charity.id} 
          name={charity.name} 
          imageUrl={charity.image_url} 
          className="h-80 w-full rounded-3xl border-4 border-border shadow-flat" 
          iconClassName="size-32 text-muted-foreground opacity-50"
        />
        
        <div className="space-y-6">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-md inline-block mb-4">
              {charity.category || "General"}
            </span>
            <h1 className="text-4xl font-heading font-bold">{charity.name}</h1>
          </div>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            {charity.description}
          </p>
          
          <div className="flex flex-col gap-4 max-w-sm">
            {!user ? (
              <Button size="lg" className="w-full" asChild>
                <Link href={`/signup?charity=${charity.id}`}>Sign up to support</Link>
              </Button>
            ) : !isActive ? (
              <Button size="lg" className="w-full" asChild>
                <Link href={`/subscribe`}>Subscribe to support</Link>
              </Button>
            ) : (
              <form action={async () => {
                "use server"
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  await supabase.from("profiles").update({ charity_id: charity.id }).eq("id", user.id)
                }
              }}>
                <Button size="lg" className="w-full" type="submit" variant={profile?.charity_id === charity.id ? "secondary" : "default"} disabled={profile?.charity_id === charity.id}>
                  {profile?.charity_id === charity.id ? "Currently Supporting" : "Select as my charity"}
                </Button>
              </form>
            )}
          </div>

          <Card className="bg-secondary/10 border-secondary ring-4 ring-secondary/20 max-w-sm">
            <CardHeader className="pb-2">
              <CardTitle>Make a One-Time Donation</CardTitle>
              <CardDescription>Support their mission directly.</CardDescription>
            </CardHeader>
            <CardContent>
              <DonationForm charityId={charity.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6 pt-12 border-t-2 border-border/20">
        <h2 className="text-3xl font-heading font-bold">Upcoming Events</h2>
        {!events || events.length === 0 ? (
          <p className="text-muted-foreground font-medium">No upcoming events scheduled at this time.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map(event => (
              <Card key={event.id} className="border-border">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription className="font-bold text-primary">{event.date}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{event.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

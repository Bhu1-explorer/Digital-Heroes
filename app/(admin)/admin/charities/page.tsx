import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { CharitiesClient } from "./client"

export default async function AdminCharitiesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: charities, error: charitiesError } = await supabase
    .from("charities")
    .select("*")
    .order("name")

  if (charitiesError) {
    console.error(charitiesError)
  }

  const { data: events, error: eventsError } = await supabase
    .from("charity_events")
    .select("*, charities(name)")
    .order("date", { ascending: false })

  if (eventsError) {
    console.error(eventsError)
  }

  return (
    <div className="container mx-auto p-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold">Manage Charities</h1>
      </div>
      
      <CharitiesClient charities={charities || []} events={events || []} />
    </div>
  )
}

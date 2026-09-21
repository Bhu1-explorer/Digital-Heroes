import { createClient } from "@/lib/supabase/server"
import { CharityDirectory } from "./directory"

export default async function CharitiesPage() {
  const supabase = await createClient()

  // Fetch all active charities
  const { data: charities } = await supabase
    .from("charities")
    .select("*")
    .eq("active", true)
    .order("name")

  return (
    <div className="container mx-auto p-4 py-12 max-w-6xl space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-heading font-bold">Our Charity Partners</h1>
        <p className="text-lg text-muted-foreground font-medium">
          Discover and support the incredible organizations working to make a difference. 
          Your subscription directly funds their mission.
        </p>
      </div>

      <CharityDirectory charities={charities || []} />
    </div>
  )
}

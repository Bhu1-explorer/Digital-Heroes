import { requireActiveSubscription } from "@/lib/auth"

export default async function DashboardPage() {
  const { profile } = await requireActiveSubscription()
  
  return (
    <div className="container mx-auto p-4 py-8 space-y-8">
      <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
      <p>Welcome to your dashboard, {profile.full_name}.</p>
      
      <div className="bg-card border-2 border-border p-8 rounded-2xl shadow-flat">
        <h2 className="text-xl font-bold mb-2">Ready for Stage 4</h2>
        <p className="text-muted-foreground">
          Score tracking and leaderboards will go here.
        </p>
      </div>
    </div>
  )
}

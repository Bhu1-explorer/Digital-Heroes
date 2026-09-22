import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { aggregateCharityTotals } from "@/lib/charity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, DollarSign, Heart, Award } from "lucide-react"

export default async function AdminPage() {
  await requireAdmin()
  const supabase = await createClient()

  // 1. Basic counts
  const [{ count: totalUsers }, { count: activeSubs }, { count: totalDraws }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('draws').select('*', { count: 'exact', head: true }),
    supabase.from('settings').select('plan_prices').single()
  ])

  // 2. Winners and Prizes
  const { data: winners } = await supabase.from('winners').select('prize_amount, tier, payment_status')
  
  let totalPaid = 0
  let totalPending = 0
  const tierCounts: Record<number, number> = { 3: 0, 4: 0, 5: 0 }
  
  if (winners) {
    for (const w of winners) {
      if (w.payment_status === 'paid') totalPaid += w.prize_amount
      else totalPending += w.prize_amount
      
      if (w.tier >= 3 && w.tier <= 5) {
        tierCounts[w.tier]++
      }
    }
  }

  // 3. Charity Contributions
  const { data: charities } = await supabase.from('charities').select('id, name')
  const { data: donations } = await supabase.from('donations').select('amount, status, charity_id')
  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select(`
      plan_type, 
      profiles!subscriptions_user_id_fkey (charity_id, charity_percent)
    `)
    .eq('status', 'active')

  let totalCharityContributions = 0
  const charityReports = []

  const planPrices = settings?.plan_prices || { monthly: 499, yearly: 4999 }

  if (charities) {
    for (const c of charities) {
      const cDonations = donations?.filter(d => d.charity_id === c.id) || []
      
      const cSubs = (activeSubscriptions as any[])
        ?.filter(s => s.profiles?.charity_id === c.id)
        .map(s => ({
          plan_type: s.plan_type as 'monthly' | 'yearly',
          price: planPrices[s.plan_type as keyof typeof planPrices] || 0,
          charity_percent: s.profiles?.charity_percent || 10
        })) || []

      const total = aggregateCharityTotals(cSubs, cDonations)
      totalCharityContributions += total
      
      charityReports.push({
        name: c.name,
        total
      })
    }
  }
  
  charityReports.sort((a, b) => b.total - a.total)

  return (
    <div className="container mx-auto p-4 py-8 space-y-8">
      <h1 className="text-3xl font-heading font-bold">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prize Pool Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalPaid / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(totalPending / 100).toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalCharityContributions / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Donations & MRR Share</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Draw Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Draws Run</span>
                <span className="font-bold">{totalDraws || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Tier 5 Winners</span>
                <span className="font-bold">{tierCounts[5]}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Tier 4 Winners</span>
                <span className="font-bold">{tierCounts[4]}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Tier 3 Winners</span>
                <span className="font-bold">{tierCounts[3]}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Contributions by Charity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {charityReports.length === 0 && (
                <p className="text-muted-foreground text-sm">No charities found.</p>
              )}
              {charityReports.map((cr, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="font-medium text-sm truncate pr-4">{cr.name}</span>
                  <span className="font-bold whitespace-nowrap">${(cr.total / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

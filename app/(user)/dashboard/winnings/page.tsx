import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { WinningsManager } from "@/components/dashboard/winnings-manager"

export default async function WinningsPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()

  const { data: winners, error } = await supabase
    .from("winners")
    .select(`
      id,
      tier,
      prize_amount,
      verification_status,
      payment_status,
      admin_note,
      paid_at,
      draws ( month )
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(error)
  }

  const totalWon = (winners || []).filter(w => w.verification_status !== 'rejected').reduce((acc, w) => acc + w.prize_amount, 0)
  const totalPaid = (winners || []).filter(w => w.payment_status === 'paid').reduce((acc, w) => acc + w.prize_amount, 0)
  const totalPending = totalWon - totalPaid

  return (
    <div className="container mx-auto p-4 py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold mb-2">My Winnings</h1>
        <p className="text-muted-foreground text-lg font-medium">Upload proofs and track payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/10 border-2 border-secondary/20 p-4 rounded-xl">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Won</div>
          <div className="text-3xl font-display text-secondary">${(totalWon / 100).toFixed(2)}</div>
        </div>
        <div className="bg-success/10 border-2 border-success/20 p-4 rounded-xl">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Paid</div>
          <div className="text-3xl font-display text-success">${(totalPaid / 100).toFixed(2)}</div>
        </div>
        <div className="bg-accent/10 border-2 border-accent/20 p-4 rounded-xl">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending</div>
          <div className="text-3xl font-display text-accent">${(totalPending / 100).toFixed(2)}</div>
        </div>
      </div>

      <WinningsManager winners={winners || []} />
    </div>
  )
}

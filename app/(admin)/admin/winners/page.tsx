import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { WinnersTable } from "@/components/admin/winners-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminWinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string, status?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const statusFilter = params.status

  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from("winners")
    .select(`
      id,
      tier,
      prize_amount,
      verification_status,
      payment_status,
      admin_note,
      proof_path,
      draws!inner(month, draw_numbers),
      profiles!winners_user_id_fkey!inner(full_name),
      draw_entries!inner(scores_snapshot)
    `, { count: "exact" })

  if (statusFilter) {
    query = query.eq("verification_status", statusFilter)
  }

  const { data: winners, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error(error)
  }

  // Summary counts
  const { data: counts } = await supabase.rpc('get_winner_counts_by_status') 
  // Wait, we don't have that RPC. We can just query counts directly or do without them for now if we want to save queries.
  // Actually, PRD: summary counts (awaiting proof, submitted, approved, paid) plus total paid out.
  // Let's just do a single grouped query for summary:
  const { data: summary } = await supabase
    .from("winners")
    .select("verification_status, payment_status, prize_amount")

  let awaiting = 0, submitted = 0, approved = 0, paid = 0, totalPaidOut = 0;
  if (summary) {
    for (const w of summary) {
      if (w.verification_status === 'awaiting_proof') awaiting++;
      if (w.verification_status === 'submitted') submitted++;
      if (w.verification_status === 'approved' && w.payment_status === 'pending') approved++;
      if (w.payment_status === 'paid') {
        paid++;
        totalPaidOut += w.prize_amount;
      }
    }
  }

  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div className="container mx-auto p-4 py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold mb-2">Winners Management</h1>
        <p className="text-muted-foreground">Verify proofs and manage payouts.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border p-4 rounded-xl text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Awaiting Proof</div>
          <div className="text-2xl font-display">{awaiting}</div>
        </div>
        <div className="bg-accent/10 border-accent/20 border p-4 rounded-xl text-center">
          <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Submitted</div>
          <div className="text-2xl font-display text-accent">{submitted}</div>
        </div>
        <div className="bg-success/10 border-success/20 border p-4 rounded-xl text-center">
          <div className="text-xs font-bold text-success uppercase tracking-wider mb-1">Approved</div>
          <div className="text-2xl font-display text-success">{approved}</div>
        </div>
        <div className="bg-primary/10 border-primary/20 border p-4 rounded-xl text-center">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Paid</div>
          <div className="text-2xl font-display text-primary">{paid}</div>
        </div>
        <div className="bg-card border p-4 rounded-xl text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Payouts</div>
          <div className="text-2xl font-display text-primary">${(totalPaidOut / 100).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={statusFilter ? "outline" : "default"} asChild>
          <Link href="/admin/winners">All</Link>
        </Button>
        <Button variant={statusFilter === "submitted" ? "default" : "outline"} asChild>
          <Link href="/admin/winners?status=submitted">Needs Review</Link>
        </Button>
        <Button variant={statusFilter === "approved" ? "default" : "outline"} asChild>
          <Link href="/admin/winners?status=approved">Pending Payout</Link>
        </Button>
      </div>

      <WinnersTable winners={winners || []} />

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" disabled={page <= 1} asChild>
            <Link href={`/admin/winners?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>Previous</Link>
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} asChild>
            <Link href={`/admin/winners?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

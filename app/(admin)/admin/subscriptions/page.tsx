import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { overrideSubscriptionStatus } from "@/app/actions/admin-subscriptions"
import Link from "next/link"

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const pageSize = 10
  const search = params.search || ""
  
  let query = supabase
    .from("subscriptions")
    .select("*, profiles!subscriptions_user_id_fkey(full_name)", { count: "exact" })
  
  if (search) {
    // We can't do an ilike on a joined table easily without a view or rpc in standard PostgREST,
    // so we'll just search by Stripe Customer ID or Subscription ID if they provide it.
    query = query.or(`stripe_customer_id.ilike.%${search}%,stripe_subscription_id.ilike.%${search}%`)
  }
  
  const { data: subscriptions, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) {
    console.error(error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 1

  return (
    <div className="container mx-auto p-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold">Manage Subscriptions</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <form className="flex gap-2 w-full max-w-sm">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by Stripe ID..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button type="submit">Search</Button>
            </form>
            {search && (
              <Button variant="outline" asChild>
                <Link href="/admin/subscriptions">Clear</Link>
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Stripe IDs</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions?.map((sub) => {
                  return (
                    <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        {sub.profiles?.full_name || "Unknown"}
                        {sub.admin_override_by && (
                          <div className="text-xs text-destructive mt-1">Manual Override</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                        <div>{sub.stripe_customer_id || "No Customer ID"}</div>
                        <div>{sub.stripe_subscription_id || "No Sub ID"}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">{sub.plan_type}</td>
                      <td className="px-4 py-3">
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <form action={async () => { "use server"; await overrideSubscriptionStatus(sub.id, true) }}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              type="submit"
                              disabled={sub.status === "active"}
                            >
                              Force Active
                            </Button>
                          </form>
                          <form action={async () => { "use server"; await overrideSubscriptionStatus(sub.id, false) }}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              type="submit"
                              disabled={sub.status !== "active"}
                            >
                              Force Cancel
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!subscriptions || subscriptions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No subscriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <Button variant="outline" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={`/admin/subscriptions?page=${page - 1}${search ? `&search=${search}` : ""}`}>
                    Previous
                  </Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? (
                  <Link href={`/admin/subscriptions?page=${page + 1}${search ? `&search=${search}` : ""}`}>
                    Next
                  </Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

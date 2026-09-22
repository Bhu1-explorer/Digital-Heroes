import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toggleUserRole } from "@/app/actions/admin-users"
import Link from "next/link"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { profile: currentAdmin } = await requireAdmin()
  const supabase = await createClient()
  
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const pageSize = 10
  const search = params.search || ""
  
  let query = supabase
    .from("profiles")
    .select("*, subscriptions!subscriptions_user_id_fkey(status, plan_type), scores(score)", { count: "exact" })
  
  if (search) {
    query = query.ilike("full_name", `%${search}%`)
  }
  
  const { data: profiles, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) {
    console.error(error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 1
  
  // Look up auth emails for the current page's user IDs
  const userIds = profiles?.map(p => p.id) || []
  const userEmails: Record<string, string> = {}
  
  if (userIds.length > 0) {
    // We can't fetch multiple users by ID array easily in one call with listUsers, 
    // but we can fetch all users and filter, or just fetch them one by one if the page size is small.
    // listUsers() returns up to 50 users, we can just fetch and map if we have small scale, 
    // but better to fetch by ID using `admin.getUserById` or query auth.users if we use postgres.
    // Wait, with service role, we can query auth.users directly via SQL or just map it.
    // Since we don't have direct access to auth.users from standard supabase-js unless we write a RPC,
    // let's fetch listUsers if search is used, or just iterate.
    for (const id of userIds) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id)
      if (data?.user?.email) {
        userEmails[id] = data.user.email
      }
    }
  }

  return (
    <div className="container mx-auto p-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold">Manage Users</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <form className="flex gap-2 w-full max-w-sm">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by name..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button type="submit">Search</Button>
            </form>
            {search && (
              <Button variant="outline" asChild>
                <Link href="/admin/users">Clear</Link>
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Subscription</th>
                  <th className="px-4 py-3">Scores</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles?.map((user) => {
                  const sub = Array.isArray(user.subscriptions) ? user.subscriptions[0] : user.subscriptions
                  const scoresList = Array.isArray(user.scores) ? user.scores : []
                  
                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{user.full_name || "Unknown"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{userEmails[user.id] || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <Badge variant={sub.status === "active" ? "default" : "outline"}>
                            {sub.plan_type} - {sub.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {scoresList.slice(0, 5).map((s: { score: number }, i: number) => (
                            <span key={i} className="inline-block w-6 text-center bg-muted rounded text-xs py-0.5">
                              {s.score}
                            </span>
                          ))}
                          {scoresList.length === 0 && <span className="text-muted-foreground text-xs">No scores</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={async () => { "use server"; await toggleUserRole(user.id) }}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="submit"
                            disabled={user.id === currentAdmin.id}
                            className={user.id === currentAdmin.id ? "opacity-50" : ""}
                          >
                            {user.role === "admin" ? "Demote to User" : "Make Admin"}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
                {(!profiles || profiles.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No users found.
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
                  <Link href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ""}`}>
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
                  <Link href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ""}`}>
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

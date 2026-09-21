import { requireActiveSubscription } from "@/lib/auth"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createPortalSession } from "@/app/actions/payments"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This enforces that the user is logged in and has an active subscription
  // or is an admin (bypasses subscription check).
  // If not, it redirects them to /subscribe or /login automatically.
  const { profile } = await requireActiveSubscription()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-heading font-bold text-xl text-primary">
            Digital Heroes
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold hidden md:inline-block">
              {profile.full_name}
            </span>
            
            <nav className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </Button>
              {profile.role === "admin" && (
                <Button variant="outline" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <form action={logout}>
                <Button type="submit" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  Logout
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  )
}

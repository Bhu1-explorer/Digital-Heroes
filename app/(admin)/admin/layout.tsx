import { requireAdmin } from "@/lib/auth"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdmin()

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="border-b-2 border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="font-heading font-bold text-xl text-primary">
            Digital Heroes <span className="text-destructive">Admin</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold hidden md:inline-block">
              {profile.full_name} (Admin)
            </span>
            
            <nav className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/admin/draws">Draws</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Back to App</Link>
              </Button>
              <form action={logout}>
                <Button type="submit" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  Logout
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

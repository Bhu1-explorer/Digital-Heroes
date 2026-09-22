import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/app/actions/auth"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-heading text-xl font-bold tracking-tight text-ink hover:text-primary transition-colors">
              Digital Heroes
            </Link>
          </div>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/charities">Charities</Link>
            </Button>
            
            {user ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <form action={logout}>
                  <Button variant="ghost" type="submit">Logout</Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
        {/* Mobile secondary nav for charities since it's hidden on very small screens in the main bar */}
        <div className="sm:hidden border-t-2 border-border/50 px-4 py-2 flex justify-center bg-muted/20">
          <Link href="/charities" className="text-sm font-semibold text-muted-foreground hover:text-ink">
            Browse Charities
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}

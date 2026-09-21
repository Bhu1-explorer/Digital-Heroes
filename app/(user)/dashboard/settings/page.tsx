import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "./form"
import { createPortalSession } from "@/app/actions/payments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default async function SettingsPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()

  // Need charities for the form dropdown
  const { data: charities } = await supabase
    .from("charities")
    .select("id, name")
    .eq("active", true)

  return (
    <div className="container mx-auto p-4 py-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile and subscription.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal info and charity preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm 
            initialProfile={profile} 
            charities={charities || []} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Manage your payment method, view invoices, or cancel your plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">You will be redirected to the secure customer portal.</p>
        </CardContent>
        <CardFooter>
          <form action={createPortalSession}>
            <Button type="submit" variant="outline">Manage Subscription</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

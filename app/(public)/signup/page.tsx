import { createClient } from "@/lib/supabase/server"
import { SignupForm } from "./form"

export default async function SignupPage() {
  const supabase = await createClient()
  
  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, image_url")
    .eq("active", true)

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card border-2 border-border p-8 rounded-3xl shadow-flat animate-slide-in">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold">Create an Account</h1>
          <p className="mt-2 text-muted-foreground font-medium">Join Digital Heroes and start playing.</p>
        </div>
        
        <SignupForm charities={charities || []} />
      </div>
    </div>
  )
}

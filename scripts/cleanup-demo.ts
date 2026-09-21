import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import path from "path"

// Load env vars from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  console.log("Cleaning up demo data...")

  // Delete demo users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const demoUsers = users.users.filter(u => u.email?.endsWith("@demo.digitalheroes.test"))
  
  for (const user of demoUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) {
      console.error(`Failed to delete user ${user.email}:`, error)
    } else {
      console.log(`Deleted user ${user.email}`)
    }
  }

  // Delete past published draw that was seeded
  const lastMonth = new Date()
  lastMonth.setDate(1)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const monthStr = lastMonth.toISOString().split("T")[0]

  const { error: drawError } = await supabase.from("draws").delete().eq("month", monthStr)
  if (drawError) {
    console.error("Failed to delete demo draw:", drawError)
  } else {
    console.log("Deleted seeded draw.")
  }

  // Delete any simulated draws as well
  await supabase.from("draws").delete().eq("status", "simulated")

  console.log("Cleanup complete.")
}

run().catch(console.error)

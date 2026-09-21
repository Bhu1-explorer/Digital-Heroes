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

const NUM_USERS = 20

// Put all scores in a narrow band (18-32) to ensure frequent overlaps
function generateScores() {
  const scores = new Set<number>()
  while (scores.size < 5) {
    scores.add(Math.floor(Math.random() * (32 - 18 + 1)) + 18)
  }
  return Array.from(scores)
}

async function run() {
  console.log("Seeding demo users...")

  // Need a charity to assign to users
  const { data: charity } = await supabase.from("charities").select("id").limit(1).single()
  const charityId = charity?.id

  // 1. Create 20 demo users
  for (let i = 1; i <= NUM_USERS; i++) {
    const email = `user${i}@demo.digitalheroes.test`
    const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: true,
      user_metadata: { full_name: `Demo User ${i}` }
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log(`${email} already exists, skipping creation.`)
        continue
      }
      throw authError
    }

    const userId = userAuth.user.id

    // Update profile
    await supabase.from("profiles").update({
      charity_id: charityId,
      charity_percent: 10
    }).eq("id", userId)

    // Create active subscription
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    await supabase.from("subscriptions").insert({
      user_id: userId,
      status: "active",
      plan_type: "monthly",
      stripe_customer_id: "demo_cus",
      stripe_subscription_id: "demo_sub",
      current_period_end: endDate.toISOString()
    })

    // Create 5 scores in the narrow band
    const scores = generateScores()
    for (let j = 0; j < 5; j++) {
      const playedOn = new Date()
      playedOn.setDate(playedOn.getDate() - (j + 1))
      
      await supabase.from("scores").insert({
        user_id: userId,
        score: scores[j],
        played_on: playedOn.toISOString().split("T")[0]
      })
    }
  }

  console.log("Demo users seeded.")

  // 2. Seed a past published draw (last month)
  console.log("Seeding a past published draw...")
  const lastMonth = new Date()
  lastMonth.setDate(1)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const monthStr = lastMonth.toISOString().split("T")[0]

  const { data: existingDraw } = await supabase.from("draws").select("id").eq("month", monthStr).maybeSingle()
  if (existingDraw) {
    console.log("Past draw already exists. Skipping draw seeding.")
    return
  }

  const { data: draw, error: drawError } = await supabase.from("draws").insert({
    month: monthStr,
    status: "published",
    mode: "algorithmic",
    algo_bias: "frequent",
    draw_numbers: [19, 23, 27, 29, 31],
    pool_total: 100000,
    pool_5: 40000,
    pool_4: 35000,
    pool_3: 25000,
    jackpot_carried_in: 0,
    jackpot_carry_out: 40000, // No tier 5 winners
    active_subscriber_count: NUM_USERS,
    unallocated_remainder: 500
  }).select("id").single()

  if (drawError) throw drawError

  const drawId = draw.id

  // Fetch some demo users to be winners
  const { data: users } = await supabase.from("profiles")
    .select("id")
    .like("id", "%%") // just get all
    .limit(3)
  
  if (users && users.length >= 3) {
    // Insert entries
    for (let i = 0; i < 3; i++) {
      const { data: entry } = await supabase.from("draw_entries").insert({
        draw_id: drawId,
        user_id: users[i].id,
        match_count: 4 - i, // match 4, 3, 2
        scores_snapshot: [19, 23, 27, 29, 10 + i]
      }).select("id").single()

      if (entry && (4 - i) >= 3) {
        // Insert winner for match 4 and 3
        await supabase.from("winners").insert({
          draw_id: drawId,
          user_id: users[i].id,
          draw_entry_id: entry.id,
          tier: 4 - i,
          prize_amount: (4 - i) === 4 ? 35000 : 25000,
          verification_status: i === 0 ? "approved" : "awaiting_proof",
          payment_status: i === 0 ? "paid" : "pending"
        })
      }
    }
  }

  console.log("Past draw and winners seeded.")
}

run().catch(console.error)

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
    let userAuth: any
    try {
      const result = await supabase.auth.admin.createUser({
        email,
        password: "password123",
        email_confirm: true,
        user_metadata: { full_name: `Demo User ${i}` }
      })
      if (result.error) throw result.error
      userAuth = result.data.user
    } catch (err: any) {
      if (err.message?.includes("already registered") || err.code === 'email_exists') {
        console.log(`${email} already exists, skipping creation.`)
        continue
      }
      throw err
    }

    const userId = userAuth.id

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

  // Fetch some demo users to be winners (need 5)
  const { data: users, error: usersError } = await supabase.from("profiles")
    .select("id")
    .limit(5)
  
  if (usersError) {
    console.error("Failed to fetch users for winners:", usersError)
    throw usersError
  }
  
  if (users && users.length >= 5) {
    // 1x1 transparent PNG
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    const pngBuffer = Buffer.from(pngBase64, "base64")

    const states = [
      { ver: "awaiting_proof", pay: "pending", needsUpload: false, note: null, paid_at: null },
      { ver: "submitted", pay: "pending", needsUpload: true, note: null, paid_at: null },
      { ver: "approved", pay: "pending", needsUpload: true, note: null, paid_at: null },
      { ver: "approved", pay: "paid", needsUpload: true, note: null, paid_at: new Date().toISOString() },
      { ver: "rejected", pay: "pending", needsUpload: true, note: "The screenshot is too blurry to read the numbers.", paid_at: null },
    ]

    for (let i = 0; i < 5; i++) {
      const state = states[i]
      const tier = i === 0 ? 5 : (i % 2 === 0 ? 4 : 3)
      const prize = tier === 5 ? 40000 : (tier === 4 ? 35000 : 25000)

      const { data: entry, error: entryError } = await supabase.from("draw_entries").insert({
        draw_id: drawId,
        user_id: users[i].id,
        match_count: tier, 
        scores_snapshot: [19, 23, 27, 29, 31]
      }).select("id").single()

      if (entryError) {
        console.error("Failed to insert draw_entry:", entryError)
        throw entryError
      }

      if (entry) {
        // Insert winner
        const { data: winner, error: winnerError } = await supabase.from("winners").insert({
          draw_id: drawId,
          user_id: users[i].id,
          draw_entry_id: entry.id,
          tier: tier,
          prize_amount: prize,
          verification_status: state.ver,
          payment_status: state.pay,
          admin_note: state.note,
          paid_at: state.paid_at
        }).select("id").single()

        if (winnerError) {
          console.error("Failed to insert winner:", winnerError)
          throw winnerError
        }

        if (winner && state.needsUpload) {
          const proofPath = `${users[i].id}/${winner.id}/demo_proof.png`
          const { error: uploadError } = await supabase.storage.from("winner-proofs").upload(proofPath, pngBuffer, {
            contentType: "image/png",
            upsert: true
          })

          if (uploadError) {
            console.error("Failed to upload proof to storage:", uploadError)
            throw uploadError
          }
          
          const { error: updateError } = await supabase.from("winners").update({
            proof_path: proofPath,
            proof_uploaded_at: new Date().toISOString()
          }).eq("id", winner.id)

          if (updateError) {
            console.error("Failed to update winner with proof_path:", updateError)
            throw updateError
          }
        }
      }
    }
  }

  console.log("Past draw and winners seeded.")
}

run().catch(console.error)

"use server"

import { requireAdmin } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { DrawMode, DrawAlgoBias, SubscriberInfo, simulateDrawEngine } from "@/lib/draw"
import { z } from "zod"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

async function getEligibleUsers() {
  // Get active subscriptions and settings
  const [subsRes, settingsRes] = await Promise.all([
    supabaseAdmin.from("subscriptions").select("user_id, plan_type"),
    supabaseAdmin.from("settings").select("plan_prices, pool_percent").eq("id", 1).single()
  ])

  if (subsRes.error) throw new Error("Failed to fetch subscriptions: " + subsRes.error.message)
  if (settingsRes.error) throw new Error("Failed to fetch settings: " + settingsRes.error.message)

  const activeSubs = subsRes.data
  const settings = settingsRes.data
  const planPrices = settings.plan_prices as { monthly: number, yearly: number }

  if (activeSubs.length === 0) return { users: [], poolPercent: settings.pool_percent }

  // Get scores for active users
  const userIds = activeSubs.map(s => s.user_id)
  const { data: scoresData, error: scoresError } = await supabaseAdmin
    .from("scores")
    .select("user_id, score, played_on")
    .in("user_id", userIds)
    .order("played_on", { ascending: false })

  if (scoresError) throw new Error("Failed to fetch scores: " + scoresError.message)

  // Group scores by user and take top 5
  const userScores = new Map<string, number[]>()
  for (const row of scoresData) {
    const list = userScores.get(row.user_id) || []
    if (list.length < 5) {
      list.push(row.score)
      userScores.set(row.user_id, list)
    }
  }

  const eligibleUsers: SubscriberInfo[] = []
  for (const sub of activeSubs) {
    const scores = userScores.get(sub.user_id) || []
    if (scores.length === 5) {
      eligibleUsers.push({
        id: sub.user_id,
        plan_type: sub.plan_type as "monthly" | "yearly",
        price: planPrices[sub.plan_type as "monthly" | "yearly"] || planPrices.monthly,
        scores: scores
      })
    }
  }

  return { users: eligibleUsers, poolPercent: settings.pool_percent }
}

async function getJackpotCarriedIn(month: string) {
  // The carried in is the jackpot_carry_out of the MOST RECENT published draw strictly before this month
  const { data, error } = await supabaseAdmin
    .from("draws")
    .select("jackpot_carry_out")
    .eq("status", "published")
    .lt("month", month)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle()
    
  if (error) throw new Error("Failed to fetch past jackpot: " + error.message)
  
  return data ? data.jackpot_carry_out : 0
}

export async function simulateDraw(formData: FormData) {
  await requireAdmin()

  const month = formData.get("month") as string
  const mode = formData.get("mode") as DrawMode
  const bias = (formData.get("bias") as DrawAlgoBias) || null

  if (!month || !mode) {
    return { error: "Missing required fields" }
  }

  try {
    const { users, poolPercent } = await getEligibleUsers()
    const jackpotCarriedIn = await getJackpotCarriedIn(month)

    const result = simulateDrawEngine(
      mode,
      bias,
      users,
      poolPercent,
      jackpotCarriedIn
    )

    // Check if a draft or simulated row exists for this month
    const { data: existingRow } = await supabaseAdmin
      .from("draws")
      .select("id, status")
      .eq("month", month)
      .neq("status", "published")
      .maybeSingle()

    const drawData = {
      month,
      status: "simulated",
      mode,
      algo_bias: bias,
      draw_numbers: result.drawNumbers,
      pool_total: result.poolTotal,
      pool_5: result.pool5,
      pool_4: result.pool4,
      pool_3: result.pool3,
      jackpot_carried_in: result.jackpotCarriedIn,
      jackpot_carry_out: result.jackpotCarryOut,
      active_subscriber_count: users.length,
      unallocated_remainder: result.unallocatedRemainder,
      updated_at: new Date().toISOString()
    }

    let saveError;
    if (existingRow) {
      const { error } = await supabaseAdmin.from("draws").update(drawData).eq("id", existingRow.id)
      saveError = error
    } else {
      const { error } = await supabaseAdmin.from("draws").insert(drawData)
      saveError = error
    }

    if (saveError) {
      console.error(saveError)
      return { error: "Failed to save simulated draft." }
    }

    // Mask winners for preview
    const maskedWinners = (winners: string[]) => winners.map(w => w.substring(0, 8) + '...')

    return {
      success: true,
      result: {
        drawNumbers: result.drawNumbers,
        poolTotal: result.poolTotal,
        jackpotCarriedIn: result.jackpotCarriedIn,
        jackpotCarryOut: result.jackpotCarryOut,
        pool5: result.pool5,
        pool4: result.pool4,
        pool3: result.pool3,
        winners5Count: result.winners5.length,
        winners4Count: result.winners4.length,
        winners3Count: result.winners3.length,
        prize5: result.prize5,
        prize4: result.prize4,
        prize3: result.prize3,
        unallocatedRemainder: result.unallocatedRemainder,
        maskedWinners5: maskedWinners(result.winners5),
        maskedWinners4: maskedWinners(result.winners4),
        maskedWinners3: maskedWinners(result.winners3),
        activeSubscriberCount: users.length
      }
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function publishDrawAction(formData: FormData) {
  const { profile } = await requireAdmin()

  const month = formData.get("month") as string
  if (!month) return { error: "Missing month" }

  try {
    // Fetch the stored simulated numbers
    const { data: draft, error: draftError } = await supabaseAdmin
      .from("draws")
      .select("*")
      .eq("month", month)
      .eq("status", "simulated")
      .single()

    if (draftError || !draft) {
      return { error: "No simulated draft found for this month. Simulate first." }
    }

    const { users, poolPercent } = await getEligibleUsers()
    const jackpotCarriedIn = await getJackpotCarriedIn(month)

    // Recompute exact results using the STORED numbers
    const result = simulateDrawEngine(
      draft.mode as DrawMode,
      draft.algo_bias as DrawAlgoBias | null,
      users,
      poolPercent,
      jackpotCarriedIn,
      draft.draw_numbers
    )

    // Prepare payload for RPC
    const payload = {
      month: month,
      draw_numbers: result.drawNumbers,
      pool_total: result.poolTotal,
      pool_5: result.pool5,
      pool_4: result.pool4,
      pool_3: result.pool3,
      jackpot_carried_in: result.jackpotCarriedIn,
      jackpot_carry_out: result.jackpotCarryOut,
      active_subscriber_count: users.length,
      unallocated_remainder: result.unallocatedRemainder,
      entries: users.map(u => {
        const matchCount = result.winners5.includes(u.id) ? 5 :
                           result.winners4.includes(u.id) ? 4 :
                           result.winners3.includes(u.id) ? 3 :
                           // We need to know exact match count even if < 3 for draw_entries
                           calculateMatchCountFromHelper(u.scores, result.drawNumbers)
        return {
          user_id: u.id,
          match_count: matchCount,
          scores_snapshot: u.scores
        }
      }),
      winners: [
        ...result.winners5.map(w => ({ user_id: w, tier: 5, prize_amount: result.prize5 })),
        ...result.winners4.map(w => ({ user_id: w, tier: 4, prize_amount: result.prize4 })),
        ...result.winners3.map(w => ({ user_id: w, tier: 3, prize_amount: result.prize3 }))
      ]
    }

    const { error: rpcError } = await supabaseAdmin.rpc("publish_draw", { 
      payload,
      p_admin_id: profile.id
    })
    
    if (rpcError) {
      console.error(rpcError)
      return { error: rpcError.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

function calculateMatchCountFromHelper(userScores: number[], drawNumbers: number[]) {
  const distinctScores = new Set(userScores);
  const drawSet = new Set(drawNumbers);
  let matches = 0;
  for (const score of distinctScores) {
    if (drawSet.has(score)) {
      matches++;
    }
  }
  return matches;
}

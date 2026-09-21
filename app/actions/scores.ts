"use server"

import { requireActiveSubscription } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { validateNewScore } from "@/lib/scores"

const addScoreSchema = z.object({
  score: z.coerce.number().min(1, "Score must be at least 1").max(45, "Score cannot exceed 45"),
  playedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
})

export async function addScore(formData: FormData) {
  const { user } = await requireActiveSubscription()
  const supabase = await createClient()

  const data = Object.fromEntries(formData.entries())
  
  const parsed = addScoreSchema.safeParse({
    score: data.score,
    playedOn: data.playedOn,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { score, playedOn } = parsed.data

  // Fetch existing scores for pre-check
  const { data: existingScores } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", user.id)

  const validation = validateNewScore(existingScores || [], playedOn, score)
  if (!validation.valid) {
    return { error: validation.error }
  }

  // Insert the score (DB trigger will enforce the rolling 5 rule securely)
  const { error } = await supabase
    .from("scores")
    .insert({
      user_id: user.id,
      score,
      played_on: playedOn,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: "You already have a score for that date, edit it instead." }
    }
    if (error.code === 'P0001' || error.code === 'P0002') {
      return { error: error.message }
    }
    return { error: "Failed to add score." }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteScore(id: string) {
  const { user } = await requireActiveSubscription()
  const supabase = await createClient()

  const { error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id) // Ensure ownership

  if (error) {
    return { error: "Failed to delete score." }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateScore(formData: FormData) {
  const { user } = await requireActiveSubscription()
  const supabase = await createClient()

  const data = Object.fromEntries(formData.entries())
  
  const parsed = addScoreSchema.safeParse({
    score: data.score,
    playedOn: data.playedOn,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const id = data.id as string
  const { score, playedOn } = parsed.data

  // Future date check
  const today = new Date().toISOString().split('T')[0]
  if (playedOn > today) {
    return { error: "Cannot enter a score for a future date." }
  }

  const { error } = await supabase
    .from("scores")
    .update({
      score,
      played_on: playedOn,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: "You already have a score for that date, edit it instead." }
    }
    return { error: "Failed to update score." }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

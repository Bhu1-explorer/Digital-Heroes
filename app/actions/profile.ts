"use server"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  charityId: z.string().min(1, "Please select a charity"),
  charityPercent: z.coerce.number().min(10, "Minimum 10% is required").max(100),
})

export async function updateProfile(formData: FormData) {
  const { user } = await requireUser()
  const supabase = await createClient()

  const data = Object.fromEntries(formData.entries())
  
  const parsed = updateProfileSchema.safeParse({
    fullName: data.fullName,
    charityId: data.charityId,
    charityPercent: data.charityPercent,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { fullName, charityId, charityPercent } = parsed.data

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      charity_id: charityId,
      charity_percent: charityPercent,
    })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

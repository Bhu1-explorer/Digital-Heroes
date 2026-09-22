"use server"

import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const charitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  is_featured: z.boolean().default(false),
  active: z.boolean().default(true),
})

export async function createCharity(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = charitySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image_url: formData.get("image_url") || "",
    category: formData.get("category"),
    is_featured: formData.get("is_featured") === "on",
    active: true,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase.from("charities").insert(parsed.data)

  if (error) {
    if (error.code === '23505') return { error: "A charity with this slug already exists." }
    return { error: error.message }
  }

  revalidatePath("/admin/charities")
  revalidatePath("/charities")
  return { success: true }
}

export async function updateCharity(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const id = formData.get("id") as string
  if (!id) return { error: "Charity ID is required" }

  const parsed = charitySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image_url: formData.get("image_url") || "",
    category: formData.get("category"),
    is_featured: formData.get("is_featured") === "on",
    active: formData.get("active") === "on",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase.from("charities").update(parsed.data).eq("id", id)

  if (error) {
    if (error.code === '23505') return { error: "A charity with this slug already exists." }
    return { error: error.message }
  }

  revalidatePath("/admin/charities")
  revalidatePath("/charities")
  return { success: true }
}

export async function deleteCharity(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Check if charity has donations or subscribers (profiles)
  const [{ count: donationsCount }, { count: profilesCount }] = await Promise.all([
    supabase.from("donations").select("*", { count: "exact", head: true }).eq("charity_id", id),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("charity_id", id)
  ])

  if ((donationsCount && donationsCount > 0) || (profilesCount && profilesCount > 0)) {
    return { 
      error: "This charity has associated donations or users. Please edit the charity and uncheck 'Active' to soft-delete it instead." 
    }
  }

  const { error } = await supabase.from("charities").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/charities")
  revalidatePath("/charities")
  return { success: true }
}

const eventSchema = z.object({
  charity_id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
})

export async function createCharityEvent(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = eventSchema.safeParse({
    charity_id: formData.get("charity_id"),
    name: formData.get("name"),
    date: formData.get("date"),
    description: formData.get("description"),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from("charity_events").insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath("/admin/charities")
  return { success: true }
}

export async function deleteCharityEvent(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  
  const { error } = await supabase.from("charity_events").delete().eq("id", id)
  if (error) return { error: error.message }
  
  revalidatePath("/admin/charities")
  return { success: true }
}

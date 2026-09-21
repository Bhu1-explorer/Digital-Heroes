"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name is required"),
  charityId: z.string().min(1, "Please select a charity"),
  charityPercent: z.coerce.number().min(10, "Minimum 10% is required").max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
})

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = Object.fromEntries(formData.entries())
  
  const parsed = signupSchema.safeParse({
    email: data.email,
    password: data.password,
    fullName: data.fullName,
    charityId: data.charityId,
    charityPercent: data.charityPercent,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, password, fullName, charityId, charityPercent } = parsed.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        charity_id: charityId,
        charity_percent: charityPercent,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Assuming email confirmation is disabled, user is now logged in.
  // Redirect them to the subscription page immediately after signup.
  redirect("/subscribe")
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = Object.fromEntries(formData.entries())
  
  const parsed = loginSchema.safeParse({
    email: data.email,
    password: data.password,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, password } = parsed.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

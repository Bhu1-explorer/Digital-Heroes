"use client"

import { useState, useTransition } from "react"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2Icon } from "lucide-react"

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success && result.redirectTo) {
        window.location.href = result.redirectTo
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border-2 border-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Email</label>
          <Input name="email" type="email" required placeholder="john@example.com" />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-1">Password</label>
          <Input name="password" type="password" required placeholder="••••••••" />
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? <Loader2Icon className="mr-2 animate-spin" /> : "Sign In"}
      </Button>
    </form>
  )
}

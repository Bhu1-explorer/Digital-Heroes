"use client"

import { useState, useTransition } from "react"
import { signup } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2Icon } from "lucide-react"

interface Charity {
  id: string
  name: string
  image_url: string
}

export function SignupForm({ charities }: { charities: Charity[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [charityId, setCharityId] = useState<string>("")
  const [charityPercent, setCharityPercent] = useState<number>(10)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    if (!charityId) {
      setError("Please select a charity")
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.append("charityId", charityId)
    formData.append("charityPercent", charityPercent.toString())

    startTransition(async () => {
      const result = await signup(formData)
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
          <label className="block text-sm font-bold mb-1">Full Name</label>
          <Input name="fullName" required placeholder="John Doe" />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-1">Email</label>
          <Input name="email" type="email" required placeholder="john@example.com" />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-1">Password</label>
          <Input name="password" type="password" required placeholder="••••••••" minLength={6} />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Select a Charity</label>
          <div className="grid grid-cols-2 gap-3">
            {charities.map(c => (
              <div 
                key={c.id}
                onClick={() => setCharityId(c.id)}
                className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${
                  charityId === c.id 
                    ? "border-primary bg-primary/5 shadow-flat-active" 
                    : "border-border shadow-flat hover:shadow-flat-active hover:-translate-y-0.5"
                }`}
              >
                <div className="font-bold text-sm">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Donation Percentage (Min 10%)</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={charityPercent} 
              onChange={(e) => setCharityPercent(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="font-display text-xl w-12 text-right">{charityPercent}%</span>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? <Loader2Icon className="mr-2 animate-spin" /> : "Sign Up"}
      </Button>
    </form>
  )
}

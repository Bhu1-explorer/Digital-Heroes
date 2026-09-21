"use client"

import { useState } from "react"
import { createDonationSession } from "@/app/actions/donations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DonationForm({ charityId }: { charityId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createDonationSession(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // If successful, redirect happens in server action so loading stays true
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm font-bold rounded-lg border-2 border-destructive">
          {error}
        </div>
      )}
      <form action={handleSubmit} className="flex gap-2">
        <input type="hidden" name="charityId" value={charityId} />
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
          <Input name="amount" type="number" min="1" max="10000" defaultValue="10" required className="pl-8 bg-white" />
        </div>
        <Button type="submit" variant="default" disabled={loading}>
          {loading ? "Processing..." : "Donate"}
        </Button>
      </form>
    </div>
  )
}

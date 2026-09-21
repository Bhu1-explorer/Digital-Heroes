"use client"

import { useState } from "react"
import { updateProfile } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2Icon, CheckCircleIcon } from "lucide-react"

interface SettingsFormProps {
  initialProfile: any
  charities: { id: string; name: string }[]
}

export function SettingsForm({ initialProfile, charities }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border-2 border-destructive text-sm font-medium">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 rounded-xl bg-success/10 text-success border-2 border-success text-sm font-medium flex items-center gap-2">
          <CheckCircleIcon className="size-5" />
          Profile updated successfully.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Full Name</label>
          <Input name="fullName" required defaultValue={initialProfile.full_name} />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-1">Select Charity</label>
          <select 
            name="charityId" 
            defaultValue={initialProfile.charity_id || ""}
            required
            className="h-12 w-full rounded-xl border-2 border-border bg-white px-4 text-base font-medium outline-none focus-visible:border-primary focus-visible:shadow-flat transition-all"
          >
            <option value="" disabled>Select a charity</option>
            {charities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Donation Percentage</label>
          <div className="flex items-center gap-4">
            <input 
              name="charityPercent"
              type="number" 
              min="10" 
              max="100" 
              defaultValue={initialProfile.charity_percent || 10}
              required
              className="h-12 w-24 rounded-xl border-2 border-border bg-white px-4 text-center text-base font-medium outline-none focus-visible:border-primary focus-visible:shadow-flat transition-all"
            />
            <span className="font-bold">%</span>
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? <Loader2Icon className="mr-2 animate-spin" /> : "Save Changes"}
      </Button>
    </form>
  )
}

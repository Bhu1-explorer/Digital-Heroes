"use client"

import { useState, useTransition } from "react"
import { uploadProof } from "@/app/actions/winners-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export function WinningsManager({ winners }: { winners: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const handleUpload = (winnerId: string, formData: FormData) => {
    setError(null)
    setUploadingId(winnerId)
    formData.append("winner_id", winnerId)

    startTransition(async () => {
      const result = await uploadProof(formData)
      if (result.error) {
        setError(result.error)
        setUploadingId(null)
      } else {
        setSuccessId(winnerId)
        setUploadingId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {winners.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No winnings yet. Keep playing to increase your chances!
          </CardContent>
        </Card>
      ) : (
        winners.map((w) => {
          const isPaid = w.payment_status === "paid"
          const status = w.verification_status
          const monthStr = new Date(w.draws.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
          
          let badgeColor = "bg-muted text-muted-foreground"
          let badgeText = "Pending"
          
          if (isPaid) {
            badgeColor = "bg-success/20 text-success"
            badgeText = "Paid"
          } else if (status === "approved") {
            badgeColor = "bg-success/20 text-success"
            badgeText = "Approved, Payout Pending"
          } else if (status === "submitted") {
            badgeColor = "bg-accent/20 text-accent"
            badgeText = "Under Review"
          } else if (status === "rejected") {
            badgeColor = "bg-destructive/20 text-destructive"
            badgeText = "Rejected"
          } else if (status === "awaiting_proof") {
            badgeColor = "bg-primary/20 text-primary"
            badgeText = "Awaiting Proof"
          }

          return (
            <Card key={w.id} className={status === "rejected" ? "border-destructive ring-2 ring-destructive/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{monthStr} Draw - Match {w.tier}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Prize: ${(w.prize_amount / 100).toFixed(2)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
                  {badgeText}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {status === "rejected" && w.admin_note && (
                  <Alert variant="destructive" className="mb-4 bg-destructive/10">
                    <AlertDescription>
                      <span className="font-bold">Admin Note:</span> {w.admin_note}
                    </AlertDescription>
                  </Alert>
                )}

                {(status === "awaiting_proof" || status === "rejected") && successId !== w.id && (
                  <form action={(formData) => handleUpload(w.id, formData)} className="space-y-4 max-w-sm">
                    <p className="text-sm">Please upload a screenshot of your scores from the official golf tracking app to claim your prize.</p>
                    <Input type="file" name="file" accept="image/jpeg,image/png,image/webp" required disabled={isPending} />
                    {error && uploadingId === w.id && (
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    )}
                    <Button type="submit" disabled={isPending}>
                      {isPending && uploadingId === w.id ? "Uploading..." : "Submit Proof"}
                    </Button>
                  </form>
                )}

                {successId === w.id && (
                  <Alert className="bg-success/10 border-success/20 text-success max-w-sm">
                    <AlertDescription className="font-bold">
                      Proof submitted successfully! It is now under review.
                    </AlertDescription>
                  </Alert>
                )}
                
                {isPaid && w.paid_at && (
                  <p className="text-sm font-medium text-success">
                    Paid on: {new Date(w.paid_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

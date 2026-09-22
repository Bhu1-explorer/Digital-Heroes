"use client"

import { useState, useTransition } from "react"
import { uploadProof } from "@/app/actions/winners-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/badge"
import { Trophy, Loader2Icon } from "lucide-react"

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
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trophy className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-1">No winnings yet</h3>
            <p className="text-muted-foreground">Keep playing to increase your chances!</p>
          </CardContent>
        </Card>
      ) : (
        winners.map((w) => {
          const isPaid = w.payment_status === "paid"
          const status = w.verification_status
          const monthStr = new Date(w.draws.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
          const statusStr = isPaid ? "paid" : status

          return (
            <Card key={w.id} className={status === "rejected" ? "border-destructive ring-2 ring-destructive/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{monthStr} Draw - Match {w.tier}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Prize: ${(w.prize_amount / 100).toFixed(2)}</p>
                </div>
                <StatusBadge status={statusStr} />
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
                      {isPending && uploadingId === w.id ? <Loader2Icon className="mr-2 animate-spin size-4" /> : null}
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

"use client"

import { useState, useTransition } from "react"
import { approveWinner, rejectWinner, markWinnerPaid, getProofSignedUrl } from "@/app/actions/winners-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

export function WinnersTable({ winners }: { winners: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [selectedWinner, setSelectedWinner] = useState<any | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  
  const [rejectNote, setRejectNote] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  
  const handleView = async (winner: any) => {
    setSelectedWinner(winner)
    setProofUrl(null)
    setIsRejecting(false)
    setRejectNote("")

    if (winner.verification_status !== 'awaiting_proof') {
      const result = await getProofSignedUrl(winner.id)
      if (result.url) {
        setProofUrl(result.url)
      }
    }
  }

  const handleApprove = () => {
    if (!selectedWinner) return
    
    const formData = new FormData()
    formData.append("winner_id", selectedWinner.id)

    startTransition(async () => {
      const result = await approveWinner(formData)
      if (!result.error) {
        setSelectedWinner(null)
        router.refresh()
      } else {
        alert(result.error)
      }
    })
  }

  const handleReject = () => {
    if (!selectedWinner || !rejectNote) return
    
    const formData = new FormData()
    formData.append("winner_id", selectedWinner.id)
    formData.append("admin_note", rejectNote)

    startTransition(async () => {
      const result = await rejectWinner(formData)
      if (!result.error) {
        setSelectedWinner(null)
        router.refresh()
      } else {
        alert(result.error)
      }
    })
  }

  const handleMarkPaid = () => {
    if (!selectedWinner) return
    
    if (!confirm("Are you sure you want to mark this as paid?")) return

    const formData = new FormData()
    formData.append("winner_id", selectedWinner.id)

    startTransition(async () => {
      const result = await markWinnerPaid(formData)
      if (!result.error) {
        setSelectedWinner(null)
        router.refresh()
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Month</th>
              <th className="px-4 py-3 font-bold">User</th>
              <th className="px-4 py-3 font-bold">Tier / Prize</th>
              <th className="px-4 py-3 font-bold">Verification</th>
              <th className="px-4 py-3 font-bold">Payment</th>
              <th className="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {winners.map(w => (
              <tr key={w.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  {new Date(w.draws.month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold">{w.profiles.full_name || 'Unknown'}</div>
                </td>
                <td className="px-4 py-3">
                  Match {w.tier}<br/>
                  <span className="text-success font-bold font-display">${(w.prize_amount / 100).toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    w.verification_status === 'approved' ? 'bg-success/20 text-success' :
                    w.verification_status === 'submitted' ? 'bg-accent/20 text-accent' :
                    w.verification_status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {w.verification_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    w.payment_status === 'paid' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {w.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => handleView(w)}>
                    Review
                  </Button>
                </td>
              </tr>
            ))}
            {winners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No winners found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedWinner} onOpenChange={(open) => !open && setSelectedWinner(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Winner</DialogTitle>
            <DialogDescription>
              {selectedWinner && `Match ${selectedWinner.tier} - ${(selectedWinner.prize_amount / 100).toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedWinner && (
            <div className="grid md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">User Snapshot</h4>
                  <div className="flex gap-2">
                    {selectedWinner.draw_entries.scores_snapshot.map((s: number, i: number) => {
                      const isMatch = selectedWinner.draws.draw_numbers.includes(s)
                      return (
                        <div key={i} className={`size-10 rounded-full flex items-center justify-center font-bold ${
                          isMatch ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : 'bg-muted text-muted-foreground'
                        }`}>
                          {s}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Draw Numbers</h4>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    {selectedWinner.draws.draw_numbers.join(', ')}
                  </div>
                </div>
                
                <div className="pt-4 space-y-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold">Status:</span> 
                    <span className="uppercase font-bold">{selectedWinner.verification_status}</span>
                  </div>
                  
                  {isRejecting ? (
                    <div className="space-y-2">
                      <Label>Reason for Rejection</Label>
                      <Textarea 
                        placeholder="e.g. Screenshot is blurry, or numbers do not match."
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectNote || isPending} className="flex-1">
                          Confirm Reject
                        </Button>
                        <Button variant="outline" onClick={() => setIsRejecting(false)} disabled={isPending}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedWinner.verification_status === 'submitted' && (
                        <>
                          <Button className="w-full bg-success text-success-foreground hover:bg-success/90" onClick={handleApprove} disabled={isPending}>
                            Approve Winner
                          </Button>
                          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={() => setIsRejecting(true)} disabled={isPending}>
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {selectedWinner.verification_status === 'approved' && selectedWinner.payment_status === 'pending' && (
                        <Button className="w-full bg-success text-success-foreground hover:bg-success/90" onClick={handleMarkPaid} disabled={isPending}>
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-muted/30 border rounded-lg flex items-center justify-center min-h-[300px] relative overflow-hidden">
                {selectedWinner.verification_status === 'awaiting_proof' ? (
                  <div className="text-muted-foreground text-center p-4">
                    Proof not uploaded yet.
                  </div>
                ) : !proofUrl ? (
                  <div className="text-muted-foreground text-center p-4">
                    Loading proof image...
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proofUrl} alt="Proof" className="max-w-full max-h-[500px] object-contain" />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

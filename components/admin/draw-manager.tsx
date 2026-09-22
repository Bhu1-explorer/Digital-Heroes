"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { simulateDraw, publishDrawAction } from "@/app/actions/draws"
import { DrawMode, DrawAlgoBias } from "@/lib/draw"

export function DrawManager() {
  const [month, setMonth] = useState(() => {
    const date = new Date();
    date.setDate(1); // Default to current month's first day
    return date.toISOString().split('T')[0];
  })
  const [mode, setMode] = useState<DrawMode>("random")
  const [bias, setBias] = useState<DrawAlgoBias>("frequent")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSimulate = async () => {
    setLoading(true)
    setError("")
    setSuccess("")
    setPreview(null)
    const formData = new FormData()
    formData.append("month", month)
    formData.append("mode", mode)
    if (mode === "algorithmic") {
      formData.append("bias", bias)
    }

    const res = await simulateDraw(formData)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setPreview(res.result)
    }
  }

  const handlePublish = async () => {
    if (!confirm("Are you sure? This will finalize the draw and record winners.")) return
    
    setLoading(true)
    setError("")
    
    const formData = new FormData()
    formData.append("month", month)

    const res = await publishDrawAction(formData)
    setLoading(false)
    
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess("Draw published successfully!")
      setPreview(null)
    }
  }

  const formatMoney = (paise: number) => `$${(paise / 100).toFixed(2)}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Draw</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive font-bold rounded-lg border-2 border-destructive">{error}</div>}
          {success && <div className="p-3 bg-success/10 text-success font-bold rounded-lg border-2 border-success">{success}</div>}
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Month (1st of month)</label>
              <input 
                type="date" 
                value={month} 
                onChange={e => setMonth(e.target.value)}
                className="w-full p-2 border-2 border-ink rounded-lg bg-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Mode</label>
              <select 
                value={mode} 
                onChange={e => setMode(e.target.value as DrawMode)}
                className="w-full p-2 border-2 border-ink rounded-lg bg-surface"
              >
                <option value="random">Random (Uniform)</option>
                <option value="algorithmic">Algorithmic (Weighted)</option>
              </select>
            </div>
            {mode === "algorithmic" && (
              <div>
                <label className="block text-sm font-bold mb-2">Bias</label>
                <select 
                  value={bias} 
                  onChange={e => setBias(e.target.value as DrawAlgoBias)}
                  className="w-full p-2 border-2 border-ink rounded-lg bg-surface"
                >
                  <option value="frequent">Frequent (More likely to draw popular numbers)</option>
                  <option value="rare">Rare (More likely to draw rare numbers)</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSimulate} disabled={loading} className="w-full">
            {loading ? "Simulating..." : "Simulate"}
          </Button>
        </CardFooter>
      </Card>

      {preview && (
        <Card className="border-secondary ring-4 ring-secondary/20">
          <CardHeader className="bg-secondary/10">
            <CardTitle>Simulation Preview</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <h3 className="font-bold text-muted-foreground mb-4">Drawn Numbers</h3>
              <div className="flex justify-center gap-4">
                {preview.drawNumbers.map((num: number, i: number) => (
                  <div key={i} className="size-16 rounded-full border-4 border-ink bg-accent flex items-center justify-center font-display text-2xl font-bold shadow-flat-sm animate-pop-in" style={{ animationDelay: `${i * 300}ms` }}>
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t-2 border-ink/10">
              <div className="bg-muted p-4 rounded-xl border-2 border-ink">
                <div className="text-sm font-bold text-muted-foreground">Total Pool</div>
                <div className="text-2xl font-display">{formatMoney(preview.poolTotal)}</div>
                <div className="text-xs text-muted-foreground mt-1">{preview.activeSubscriberCount} active subs</div>
              </div>
              <div className="bg-muted p-4 rounded-xl border-2 border-ink">
                <div className="text-sm font-bold text-muted-foreground">Jackpot Carried In</div>
                <div className="text-2xl font-display text-primary">{formatMoney(preview.jackpotCarriedIn)}</div>
              </div>
              <div className="bg-muted p-4 rounded-xl border-2 border-ink">
                <div className="text-sm font-bold text-muted-foreground">Jackpot Carry Out</div>
                <div className="text-2xl font-display text-secondary">{formatMoney(preview.jackpotCarryOut)}</div>
              </div>
              <div className="bg-muted p-4 rounded-xl border-2 border-ink">
                <div className="text-sm font-bold text-muted-foreground">Unallocated Remainder</div>
                <div className="text-2xl font-display">{formatMoney(preview.unallocatedRemainder)}</div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-ink/10">
              <h3 className="font-bold text-lg">Tier Breakdown</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-2 border-ink p-4 rounded-xl relative">
                  <div className="absolute -top-3 -left-3 bg-secondary text-secondary-foreground font-bold px-3 py-1 rounded-full border-2 border-ink text-sm shadow-flat-sm">Match 5</div>
                  <div className="mt-4 flex justify-between items-end border-b-2 border-ink/10 pb-2">
                    <span className="font-bold text-muted-foreground">Tier Pool</span>
                    <span className="font-display text-xl">{formatMoney(preview.pool5)}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-end border-b-2 border-ink/10 pb-2">
                    <span className="font-bold text-muted-foreground">Winners</span>
                    <span className="font-bold">{preview.winners5Count}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-end pb-2">
                    <span className="font-bold text-muted-foreground">Prize per winner</span>
                    <span className="font-bold">{formatMoney(preview.prize5)}</span>
                  </div>
                </div>

                <div className="border-2 border-ink p-4 rounded-xl relative">
                  <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full border-2 border-ink text-sm shadow-flat-sm">Match 4</div>
                  <div className="mt-4 flex justify-between items-end border-b-2 border-ink/10 pb-2">
                    <span className="font-bold text-muted-foreground">Tier Pool</span>
                    <span className="font-display text-xl">{formatMoney(preview.pool4)}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-end border-b-2 border-ink/10 pb-2">
                    <span className="font-bold text-muted-foreground">Winners</span>
                    <span className="font-bold">{preview.winners4Count}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-end pb-2">
                    <span className="font-bold text-muted-foreground">Prize per winner</span>
                    <span className="font-bold">{formatMoney(preview.prize4)}</span>
                  </div>
                </div>

                <div className="border-2 border-ink p-4 rounded-xl relative">
                  <div className="absolute -top-3 -left-3 bg-success text-success-foreground font-bold px-3 py-1 rounded-full border-2 border-ink text-sm shadow-flat-sm">Match 3</div>
                  <div className="mt-4 flex justify-between items-end border-b-2 border-ink/10 pb-2">
                    <span className="font-bold text-muted-foreground">Tier Pool</span>
                    <span className="font-display text-xl">{formatMoney(preview.pool3)}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-end border-b-2 border-ink/10 pb-2">
                    <span className="font-bold text-muted-foreground">Winners</span>
                    <span className="font-bold">{preview.winners3Count}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-end pb-2">
                    <span className="font-bold text-muted-foreground">Prize per winner</span>
                    <span className="font-bold">{formatMoney(preview.prize3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePublish} disabled={loading} variant="default" className="w-full bg-success text-success-foreground hover:bg-success/90">
              {loading ? "Publishing..." : "Publish Draw"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

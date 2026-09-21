"use client"

import { useState } from "react"
import { addScore, deleteScore, updateScore } from "@/app/actions/scores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Score } from "@/lib/scores"
import { Loader2Icon, Trash2Icon, PencilIcon, XIcon, CheckIcon } from "lucide-react"

export function ScoreManager({ initialScores }: { initialScores: Score[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState<string>("")
  const [editDate, setEditDate] = useState<string>("")

  // Sort scores newest first
  const sortedScores = [...initialScores].sort((a, b) => {
    if (a.played_on > b.played_on) return -1
    if (a.played_on < b.played_on) return 1
    if (a.created_at > b.created_at) return -1
    if (a.created_at < b.created_at) return 1
    return 0
  })

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await addScore(formData)
    
    if (result?.error) {
      setError(result.error)
    } else {
      (e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setLoading(true)
    setError(null)
    const result = await deleteScore(id)
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  function startEdit(score: Score) {
    setEditingId(score.id)
    setEditScore(score.score.toString())
    setEditDate(score.played_on)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleUpdate(id: string) {
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append("id", id)
    formData.append("score", editScore)
    formData.append("playedOn", editDate)

    const result = await updateScore(formData)
    
    if (result?.error) {
      setError(result.error)
    } else {
      setEditingId(null)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border-2 border-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-4 items-end bg-muted/50 p-4 rounded-xl border-2 border-border">
        <div className="flex-1">
          <label className="block text-xs font-bold mb-1">Date</label>
          <Input name="playedOn" type="date" required max={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold mb-1">Score</label>
          <Input name="score" type="number" min="1" max="45" required placeholder="e.g. 18" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2Icon className="animate-spin size-4" /> : "Add Score"}
        </Button>
      </form>

      <div className="space-y-3">
        {sortedScores.length === 0 ? (
          <p className="text-muted-foreground text-sm font-medium text-center py-8">
            No scores yet. Add your first score above!
          </p>
        ) : (
          sortedScores.map((score, index) => {
            const isEditing = editingId === score.id
            return (
              <div key={score.id} className="flex items-center justify-between p-3 border-2 border-border rounded-xl bg-white shadow-flat-sm">
                {isEditing ? (
                  <div className="flex items-center gap-3 flex-1 mr-4">
                    <Input 
                      type="date" 
                      value={editDate} 
                      onChange={e => setEditDate(e.target.value)} 
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <Input 
                      type="number" 
                      min="1" max="45" 
                      value={editScore} 
                      onChange={e => setEditScore(e.target.value)} 
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="font-display text-2xl w-12 text-center text-primary bg-primary/10 rounded-lg py-1 border-2 border-primary/20">
                      {score.score}
                    </div>
                    <div className="font-medium">
                      {score.played_on}
                      {index === 4 && <span className="ml-2 text-xs text-muted-foreground">(Oldest)</span>}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleUpdate(score.id)} disabled={loading}>
                        <CheckIcon className="size-4 text-success" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={cancelEdit} disabled={loading}>
                        <XIcon className="size-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(score)} disabled={loading}>
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(score.id)} disabled={loading}>
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

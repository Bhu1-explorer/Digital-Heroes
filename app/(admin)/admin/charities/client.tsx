"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCharity, updateCharity, deleteCharity, createCharityEvent, deleteCharityEvent } from "@/app/actions/admin-charities"
import { Loader2 } from "lucide-react"

interface Charity { id: string; name: string; category?: string; active?: boolean; is_featured?: boolean; description?: string; slug?: string; image_url?: string }
interface CharityEvent { id: string; name: string; date: string; charities?: { name: string } }

export function CharitiesClient({ charities, events }: { charities: Charity[], events: CharityEvent[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Basic states for simple forms
  const [editingCharity, setEditingCharity] = useState<Partial<Charity> | null>(null)

  async function handleCharitySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const action = editingCharity ? updateCharity : createCharity
    
    if (editingCharity && editingCharity.id) {
      formData.append("id", editingCharity.id)
    }

    const result = await action(formData)
    
    if (result.error) {
      setError(result.error)
    } else {
      setEditingCharity(null)
      // form reset handled by React automatically if we were using useActionState, but here we can just clear editing state
    }
    setLoading(false)
  }

  async function handleDeleteCharity(id: string) {
    if (!confirm("Are you sure you want to delete this charity?")) return
    setLoading(true)
    const result = await deleteCharity(id)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  async function handleEventSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await createCharityEvent(formData)
    if (result.error) setError(result.error)
    else (e.target as HTMLFormElement).reset()
    setLoading(false)
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event?")) return
    setLoading(true)
    const result = await deleteCharityEvent(id)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl font-medium border-2 border-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Charities</CardTitle>
              <Button onClick={() => setEditingCharity({})} disabled={editingCharity !== null}>
                Add New Charity
              </Button>
            </CardHeader>
            <CardContent>
              {editingCharity !== null && (
                <form onSubmit={handleCharitySubmit} className="mb-8 p-4 border rounded-xl bg-muted/20 space-y-4">
                  <h3 className="font-bold">{editingCharity.id ? "Edit Charity" : "New Charity"}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input name="name" required defaultValue={editingCharity.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input name="slug" required defaultValue={editingCharity.slug} pattern="^[a-z0-9-]+$" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input name="category" defaultValue={editingCharity.category} />
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input name="image_url" type="url" defaultValue={editingCharity.image_url} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input name="description" defaultValue={editingCharity.description} />
                  </div>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="is_featured" defaultChecked={editingCharity.is_featured} />
                      Featured
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="active" defaultChecked={editingCharity.active ?? true} />
                      Active
                    </label>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" onClick={() => setEditingCharity(null)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charities.map((c, idx) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 animate-slide-in" style={{ animationDelay: `${idx * 30}ms` }}>
                        <td className="px-4 py-3 font-medium">
                          {c.name}
                          {c.is_featured && <Badge variant="secondary" className="ml-2 text-[10px]">Featured</Badge>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.category || "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.active ? "active" : "inactive"} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditingCharity(c)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteCharity(c.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                    {charities.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No charities found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Charity Events</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEventSubmit} className="mb-6 space-y-4">
                <div className="space-y-2">
                  <Label>Charity</Label>
                  <select name="charity_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Select Charity...</option>
                    {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" name="date" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Event
                </Button>
              </form>

              <div className="space-y-4">
                {events.map((e, idx) => (
                  <div key={e.id} className="p-3 border rounded-lg bg-muted/10 text-sm flex justify-between items-start gap-4 animate-slide-in" style={{ animationDelay: `${idx * 30}ms` }}>
                    <div>
                      <div className="font-bold">{e.name}</div>
                      <div className="text-muted-foreground text-xs">{e.charities?.name} • {new Date(e.date).toLocaleDateString()}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteEvent(e.id)}>×</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

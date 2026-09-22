"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HeartHands } from "@/components/illustrations"
import Image from "next/image"

interface Charity {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  category: string | null
}

export function CharityDirectory({ charities }: { charities: Charity[] }) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")

  const categories = ["All", ...Array.from(new Set(charities.map(c => c.category).filter(Boolean)))] as string[]

  const filtered = useMemo(() => {
    return charities.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.description || "").toLowerCase().includes(search.toLowerCase())
      const matchCat = categoryFilter === "All" || c.category === categoryFilter
      return matchSearch && matchCat
    })
  }, [charities, search, categoryFilter])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/50 p-4 rounded-2xl border-2 border-border">
        <Input 
          placeholder="Search charities..." 
          className="max-w-md bg-white" 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat)}
              className="rounded-xl font-bold"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-medium">
          No charities found matching your criteria.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c, idx) => (
            <Link key={c.id} href={`/charities/${c.slug}`} className="block group">
              <Card className="h-full transition-all group-hover:shadow-flat group-hover:-translate-y-1 overflow-hidden flex flex-col" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="relative h-48 w-full border-b-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                  {c.image_url ? (
                    <Image src={c.image_url} alt={c.name} fill className="object-cover" />
                  ) : (
                    <HeartHands className="size-24 text-muted-foreground opacity-50" />
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {c.category || "General"}
                    </span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-base line-clamp-3">
                    {c.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

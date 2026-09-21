import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HeartHands, CoinStack, DrawMachine, NotepadScores, Ticket } from "@/components/illustrations"
import { Skeleton } from "@/components/ui/skeleton"

export default function TestComponentsPage() {
  return (
    <div className="container mx-auto p-8 space-y-16">
      <div className="space-y-4">
        <h1 className="text-4xl">Design System Test</h1>
        <p className="text-muted-foreground text-lg">
          Verifying the flat, illustration-led tokens (cobalt blue, pink, yellow, mint).
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl border-b-2 border-border pb-2 inline-block">Buttons & Inputs</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Primary CTA</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <div className="w-72">
            <Input placeholder="Enter something..." />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl border-b-2 border-border pb-2 inline-block">Cards & Skeletons</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Flat Card Design</CardTitle>
              <CardDescription>Notice the 2px border and flat shadow.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content goes here. It uses Figtree for the body font.</p>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl border-b-2 border-border pb-2 inline-block">Illustrations</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="space-y-2 text-center">
            <HeartHands className="w-24 h-24 mx-auto" />
            <p className="font-bold">Heart Hands</p>
          </div>
          <div className="space-y-2 text-center">
            <CoinStack className="w-24 h-24 mx-auto" />
            <p className="font-bold">Coin Stack</p>
          </div>
          <div className="space-y-2 text-center">
            <DrawMachine className="w-24 h-24 mx-auto" />
            <p className="font-bold">Draw Machine</p>
          </div>
          <div className="space-y-2 text-center">
            <NotepadScores className="w-24 h-24 mx-auto" />
            <p className="font-bold">Notepad Scores</p>
          </div>
          <div className="space-y-2 text-center">
            <Ticket className="w-24 h-24 mx-auto" />
            <p className="font-bold">Ticket</p>
          </div>
        </div>
      </section>
      
      <section className="space-y-6">
        <h2 className="text-2xl border-b-2 border-border pb-2 inline-block">Draw Numbers</h2>
        <div className="flex gap-4">
          {[12, 34, 5, 42, 19].map(num => (
            <div key={num} className="w-16 h-16 rounded-full border-2 border-border bg-accent text-accent-foreground flex items-center justify-center font-display text-2xl shadow-flat-sm">
              {num}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

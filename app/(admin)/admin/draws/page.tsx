import { DrawManager } from "@/components/admin/draw-manager"

export const metadata = {
  title: 'Manage Draws - Digital Heroes',
}

export default function AdminDrawsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Manage Draws</h1>
        <p className="text-muted-foreground mt-2">
          Configure the monthly draw, preview the simulation, and publish the final results.
        </p>
      </div>

      <DrawManager />
    </div>
  )
}

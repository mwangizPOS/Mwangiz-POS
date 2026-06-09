import { useState } from 'react'
import { Edit, Plus, ToggleLeft, UsersRound, Loader2 } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Modal } from '@/components/app/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useReferenceData } from '@/hooks/useReferenceData'

export function ManagerWorkersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<any | null>(null)

  const { workers, services, isLoading } = useReferenceData()

  const safeWorkers = (workers as any[]) ?? []
  const safeServices = (services as any[]) ?? []
  const activeServices = safeServices.filter((s) => s.active)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <SectionHeader
        eyebrow="Workers"
        title="Branch workers"
        description="Worker skills are informational only."
        actions={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Create worker
          </Button>
        }
      />

      <section className="grid gap-3 xl:grid-cols-2">
        {safeWorkers.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-secondary-foreground">
            No workers found.
          </div>
        ) : null}
        {safeWorkers.map((worker) => (
          <Card key={worker.id}>
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-orange/12 text-orange">
                  <UsersRound className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{worker.full_name}</p>
                    <Badge variant={worker.active ? 'default' : 'outline'}>{worker.active ? 'Active' : 'Disabled'}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-secondary-foreground">{worker.phone}</p>
                  <p className="mt-1 text-sm text-secondary-foreground">
                    {worker.skills?.length > 0 ? worker.skills.join(', ') : 'No specific skills'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingWorker(worker)}>
                  <Edit className="size-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button type="button" variant="outline">
                  <ToggleLeft className="size-4" aria-hidden="true" />
                  Disable
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create branch worker" description="Add a new worker to this branch.">
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setIsCreateOpen(false) }}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input placeholder="e.g. Jane Doe" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <Input placeholder="e.g. 0712345678" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Specialties</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {activeServices.map((service) => (
                <label key={service.name} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create Worker</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editingWorker} onClose={() => setEditingWorker(null)} title="Edit worker" description={`Update details for ${editingWorker}.`}>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setEditingWorker(null) }}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <Input placeholder="e.g. 0712345678" defaultValue="0712345678" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Specialties</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {activeServices.map((service) => (
                <label key={service.name} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" defaultChecked />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setEditingWorker(null)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

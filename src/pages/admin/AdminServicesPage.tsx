import { useState } from 'react'
import { GitBranch, Plus, Scissors } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Modal } from '@/components/app/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { services } from '@/pages/mockData'

export function AdminServicesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <SectionHeader
        eyebrow="Services"
        title="Global service catalog"
        description="Manage global services and branch assignment UI."
        actions={
          <>
            <Button type="button" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Create Global Service
            </Button>
            <Button type="button" variant="outline">
              <GitBranch className="size-4" aria-hidden="true" />
              Assign Service To Branches
            </Button>
          </>
        }
      />

      <section className="grid gap-3 xl:grid-cols-2">
        {services.map((service) => (
          <Card key={service.name}>
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Scissors className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{service.name}</p>
                    <Badge variant={service.scope === 'Global' ? 'default' : 'outline'}>{service.scope}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-secondary-foreground">
                    {service.price} · {service.commission} commission · {service.status}
                  </p>
                </div>
              </div>
              <Button type="button" variant="outline">Edit Service</Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create global service" description="Add a new service available to every branch.">
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setIsCreateOpen(false) }}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Service Name</label>
            <Input placeholder="e.g. Knotless Braids" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Default Price (KES)</label>
            <Input type="number" placeholder="e.g. 3000" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Commission %</label>
            <Input type="number" placeholder="e.g. 40" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create Global Service</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

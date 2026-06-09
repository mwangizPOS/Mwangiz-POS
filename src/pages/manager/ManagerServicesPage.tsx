import { useState } from 'react'
import { Edit, Plus, Scissors, ToggleLeft, Loader2 } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Modal } from '@/components/app/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useReferenceData } from '@/hooks/useReferenceData'
import { formatMoney } from '@/pages/cashier/cashierSaleLogic'

export function ManagerServicesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)

  const { services, isLoading } = useReferenceData()

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
        eyebrow="Services"
        title="Branch services"
        description="Branch-scoped catalog management."
        actions={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Create service
          </Button>
        }
      />

      <section className="grid gap-3 xl:grid-cols-2">
        {services?.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-secondary-foreground">
            No services found.
          </div>
        ) : null}
        {services?.map((service: any) => (
          <Card key={service.id}>
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Scissors className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{service.name}</p>
                    <Badge variant={service.active ? 'default' : 'outline'}>{service.active ? 'Active' : 'Disabled'}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-secondary-foreground">
                    {formatMoney(service.default_price)} · {service.commission_percent}% commission
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingService(service)}>
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

      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create branch service" description="Add a new service specific to this branch.">
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
            <Button type="submit">Create Service</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editingService} onClose={() => setEditingService(null)} title="Edit service" description={`Update pricing and commission for ${editingService}.`}>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setEditingService(null) }}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Default Price (KES)</label>
            <Input type="number" placeholder="e.g. 3000" defaultValue="3000" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Commission %</label>
            <Input type="number" placeholder="e.g. 40" defaultValue="40" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setEditingService(null)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

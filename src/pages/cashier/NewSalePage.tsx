import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, ReceiptText, Save, Trash2, UserPlus } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cashierServiceCatalog, cashierWorkers } from '@/pages/mockData'
import { useUiStore } from '@/store/uiStore'
import {
  calculateClientTotals,
  calculateSaleTotal,
  formatMoney,
  type CashierSaleClientDraft,
  type CashierSaleItemDraft,
} from './cashierSaleLogic'

export function NewSalePage() {
  const activeSaleDraft = useUiStore((state) => state.activeSaleDraft)
  const setActiveSaleDraft = useUiStore((state) => state.setActiveSaleDraft)
  const saveActiveSaleDraft = useUiStore((state) => state.saveActiveSaleDraft)
  const setActiveRoute = useUiStore((state) => state.setActiveRoute)
  const [saved, setSaved] = useState(false)
  const clients = activeSaleDraft.clients
  const clientTotals = useMemo(() => calculateClientTotals(clients), [clients])
  const grandTotal = useMemo(() => calculateSaleTotal(clients), [clients])
  const serviceLineCount = clients.reduce((sum, client) => sum + client.items.length, 0)

  function updateDraft(clientsPatch: CashierSaleClientDraft[]) {
    setSaved(false)
    setActiveSaleDraft({
      ...activeSaleDraft,
      clients: clientsPatch,
    })
  }

  function addClient() {
    const nextNumber = clients.length + 1
    updateDraft([
      ...clients,
      {
        id: `client-${Date.now()}`,
        label: `Client ${nextNumber}`,
        items: [],
      },
    ])
  }

  function updateClientLabel(clientId: string, label: string) {
    updateDraft(clients.map((client) => (client.id === clientId ? { ...client, label } : client)))
  }

  function removeClient(clientId: string) {
    if (clients.length === 1) {
      return
    }

    updateDraft(clients.filter((client) => client.id !== clientId))
  }

  function addServiceRow(clientId: string) {
    const defaultService = cashierServiceCatalog[0]
    const defaultWorker = cashierWorkers[0]

    updateDraft(
      clients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              items: [
                ...client.items,
                {
                  id: `item-${Date.now()}-${client.items.length}`,
                  serviceId: defaultService.id,
                  workerId: defaultWorker.id,
                  price: defaultService.defaultPrice,
                },
              ],
            }
          : client,
      ),
    )
  }

  function updateServiceRow(clientId: string, itemId: string, patch: Partial<CashierSaleItemDraft>) {
    updateDraft(
      clients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              items: client.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : client,
      ),
    )
  }

  function handleServiceChange(clientId: string, itemId: string, serviceId: string) {
    const selectedService = cashierServiceCatalog.find((service) => service.id === serviceId)
    updateServiceRow(clientId, itemId, {
      serviceId,
      price: selectedService?.defaultPrice ?? 0,
    })
  }

  function removeServiceRow(clientId: string, itemId: string) {
    updateDraft(
      clients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              items: client.items.filter((item) => item.id !== itemId),
            }
          : client,
      ),
    )
  }

  function saveDraft() {
    saveActiveSaleDraft()
    setSaved(true)
  }

  return (
    <>
      <SectionHeader
        eyebrow="Step 1"
        title="Build Sale"
        description="Create lightweight clients, add services, assign workers, and confirm prices."
        actions={
          <>
            <Button type="button" variant="outline" size="lg" onClick={() => setActiveRoute('drafts')}>
              <FileText className="size-4" aria-hidden="true" />
              Drafts
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={saveDraft}>
              <Save className="size-4" aria-hidden="true" />
              Save Draft
            </Button>
            <Button type="button" size="lg" disabled={serviceLineCount === 0} onClick={() => setActiveRoute('checkout')}>
              <ReceiptText className="size-4" aria-hidden="true" />
              Checkout
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{activeSaleDraft.saleNumber}</CardTitle>
                <CardDescription>Draft sale structure only</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {saved ? <Badge>Saved</Badge> : <Badge variant="outline">Unsaved changes</Badge>}
                <Badge variant="outline">{serviceLineCount} service lines</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <SummaryPill label="Clients" value={String(clients.length)} />
              <SummaryPill label="Services" value={String(serviceLineCount)} />
              <SummaryPill label="Grand Total" value={formatMoney(grandTotal)} />
            </CardContent>
          </Card>

          {clients.map((client, index) => (
            <ClientSaleCard
              key={client.id}
              client={client}
              index={index}
              canRemove={clients.length > 1}
              onLabelChange={updateClientLabel}
              onRemoveClient={removeClient}
              onAddService={addServiceRow}
              onServiceChange={handleServiceChange}
              onWorkerChange={(clientId, itemId, workerId) => updateServiceRow(clientId, itemId, { workerId })}
              onPriceChange={(clientId, itemId, price) => updateServiceRow(clientId, itemId, { price })}
              onRemoveService={removeServiceRow}
            />
          ))}
        </div>

        <aside className="grid gap-4 xl:sticky xl:top-24 xl:self-start">
          <SaleSummaryCard clientTotals={clientTotals} grandTotal={grandTotal} />
          <Card>
            <CardHeader>
              <CardTitle>Build Actions</CardTitle>
              <CardDescription>Move forward only after the sale structure is ready.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button type="button" variant="outline" size="lg" onClick={addClient}>
                <UserPlus className="size-4" aria-hidden="true" />
                Add Client
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={saveDraft}>
                <Save className="size-4" aria-hidden="true" />
                Save Draft
              </Button>
              <Button type="button" size="lg" disabled={serviceLineCount === 0} onClick={() => setActiveRoute('checkout')}>
                <ReceiptText className="size-4" aria-hidden="true" />
                Continue to Checkout
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </>
  )
}

function ClientSaleCard({
  client,
  index,
  canRemove,
  onLabelChange,
  onRemoveClient,
  onAddService,
  onServiceChange,
  onWorkerChange,
  onPriceChange,
  onRemoveService,
}: {
  client: CashierSaleClientDraft
  index: number
  canRemove: boolean
  onLabelChange: (clientId: string, label: string) => void
  onRemoveClient: (clientId: string) => void
  onAddService: (clientId: string) => void
  onServiceChange: (clientId: string, itemId: string, serviceId: string) => void
  onWorkerChange: (clientId: string, itemId: string, workerId: string) => void
  onPriceChange: (clientId: string, itemId: string, price: number) => void
  onRemoveService: (clientId: string, itemId: string) => void
}) {
  const total = client.items.reduce((sum, item) => sum + item.price, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <CardTitle>Client {index + 1}</CardTitle>
            <CardDescription>Client label only</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{formatMoney(total)}</Badge>
            <Button type="button" variant="outline" onClick={() => onAddService(client.id)}>
              <Plus className="size-4" aria-hidden="true" />
              Add service
            </Button>
            <Button type="button" variant="ghost" disabled={!canRemove} onClick={() => onRemoveClient(client.id)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Remove
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={`${client.id}-label`}>
              Client label
            </label>
            <Input
              id={`${client.id}-label`}
              value={client.label}
              onChange={(event) => onLabelChange(client.id, event.target.value)}
              placeholder="Client label"
            />
          </div>

          <div className="grid gap-3">
            {client.items.length === 0 ? (
              <div className="rounded-md border border-dashed bg-background p-4 text-sm text-secondary-foreground">
                No services added.
              </div>
            ) : (
              client.items.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  clientId={client.id}
                  onServiceChange={onServiceChange}
                  onWorkerChange={onWorkerChange}
                  onPriceChange={onPriceChange}
                  onRemoveService={onRemoveService}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ServiceRow({
  clientId,
  item,
  onServiceChange,
  onWorkerChange,
  onPriceChange,
  onRemoveService,
}: {
  clientId: string
  item: CashierSaleItemDraft
  onServiceChange: (clientId: string, itemId: string, serviceId: string) => void
  onWorkerChange: (clientId: string, itemId: string, workerId: string) => void
  onPriceChange: (clientId: string, itemId: string, price: number) => void
  onRemoveService: (clientId: string, itemId: string) => void
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-background p-3 lg:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_140px_auto] lg:items-end">
      <div className="grid gap-2">
        <label className="text-xs font-medium text-secondary-foreground" htmlFor={`${item.id}-service`}>
          Service
        </label>
        <select
          id={`${item.id}-service`}
          value={item.serviceId}
          onChange={(event) => onServiceChange(clientId, item.id, event.target.value)}
          className="h-11 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
        >
          {cashierServiceCatalog.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium text-secondary-foreground" htmlFor={`${item.id}-worker`}>
          Worker
        </label>
        <select
          id={`${item.id}-worker`}
          value={item.workerId}
          onChange={(event) => onWorkerChange(clientId, item.id, event.target.value)}
          className="h-11 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
        >
          {cashierWorkers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium text-secondary-foreground" htmlFor={`${item.id}-price`}>
          Price
        </label>
        <Input
          id={`${item.id}-price`}
          type="number"
          min={0}
          value={item.price}
          onChange={(event) => onPriceChange(clientId, item.id, Number(event.target.value))}
        />
      </div>

      <Button type="button" variant="outline" size="icon" aria-label="Remove service" onClick={() => onRemoveService(clientId, item.id)}>
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

function SaleSummaryCard({ clientTotals, grandTotal }: { clientTotals: Array<{ clientId: string; label: string; total: number }>; grandTotal: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Running Totals</CardTitle>
        <CardDescription>Totals update as services change.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {clientTotals.map((client) => (
          <div key={client.clientId} className="flex items-center justify-between rounded-md border bg-background px-3 py-3 text-sm">
            <span className="truncate text-secondary-foreground">{client.label || 'Untitled client'}</span>
            <span className="font-semibold">{formatMoney(client.total)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
          <span>Grand Total</span>
          <span className="text-primary">{formatMoney(grandTotal)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}

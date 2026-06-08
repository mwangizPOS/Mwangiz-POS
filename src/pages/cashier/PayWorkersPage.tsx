import { useMemo, useState } from 'react'
import { BadgeDollarSign, CheckCircle2, Search } from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { Modal } from '@/components/app/Modal'
import { SectionHeader } from '@/components/app/SectionHeader'
import { SimpleTabs } from '@/components/app/SimpleTabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { workerSettlements } from '@/pages/mockData'

type SettlementTab = 'Pending' | 'Paid'

export function PayWorkersPage() {
  const [activeTab, setActiveTab] = useState<SettlementTab>('Pending')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [selectedWorker, setSelectedWorker] = useState<(typeof workerSettlements)[number] | null>(null)
  const [paidWorkerName, setPaidWorkerName] = useState<string | null>(null)
  const roles = ['All', ...Array.from(new Set(workerSettlements.map((worker) => worker.role)))]
  const filteredWorkers = useMemo(
    () =>
      workerSettlements.filter((worker, index) => {
        const status = index % 2 === 0 ? 'Pending' : 'Paid'
        const matchesTab = activeTab === status
        const matchesRole = roleFilter === 'All' || worker.role === roleFilter
        const matchesQuery = `${worker.name} ${worker.role}`.toLowerCase().includes(query.toLowerCase())

        return matchesTab && matchesRole && matchesQuery
      }),
    [activeTab, query, roleFilter],
  )

  return (
    <>
      <SectionHeader
        eyebrow="Pay Workers"
        title="Worker settlements"
        description="Settlement details stay inside each worker view."
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <SimpleTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'Pending', label: 'Pending', count: 2 },
            { id: 'Paid', label: 'Paid', count: 2 },
          ]}
        />
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="worker-role-filter">
            Filter by specialty
          </label>
          <select
            id="worker-role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="mb-2 block text-sm font-medium" htmlFor="worker-search">
            Search workers
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="worker-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Worker name or specialty"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredWorkers.length === 0 ? (
        <EmptyState icon={BadgeDollarSign} title="No workers found" description="Try another status or filter." />
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkers.map((worker) => (
            <Card key={worker.name}>
              <CardContent className="grid gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/12 text-primary">
                    <BadgeDollarSign className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{worker.name}</p>
                    <p className="truncate text-sm text-secondary-foreground">{worker.role}</p>
                  </div>
                  <Badge variant={activeTab === 'Pending' ? 'orange' : 'default'}>{activeTab}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-secondary-foreground">
                  <span>{activeTab === 'Pending' ? 'Outstanding balance' : 'Paid history'}</span>
                  <span className="text-right">{worker.lastPaid}</span>
                </div>
                <Button type="button" variant="outline" onClick={() => setSelectedWorker(worker)}>
                  Open worker
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Modal
        open={Boolean(selectedWorker)}
        title={selectedWorker?.name ?? 'Worker'}
        description="Settlement detail"
        onClose={() => setSelectedWorker(null)}
      >
        {selectedWorker ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailTile label="Outstanding" value={selectedWorker.outstanding} />
              <DetailTile label="Total earned" value={selectedWorker.earned} />
              <DetailTile label="Last payment" value={selectedWorker.lastPaid} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <HistoryCard title="Pending history" entries={[`Current balance ${selectedWorker.outstanding}`, 'Awaiting cashier settlement']} />
              <HistoryCard title="Paid history" entries={selectedWorker.history} />
            </div>
            <Button type="button" variant="orange" onClick={() => setPaidWorkerName(selectedWorker.name)}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Mark Paid
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(paidWorkerName)}
        title="Mark settlement paid"
        description="UI placeholder only"
        onClose={() => setPaidWorkerName(null)}
      >
        <div className="grid gap-4">
          <DetailTile label="Worker" value={paidWorkerName ?? ''} />
          <Button type="button" variant="orange" onClick={() => setPaidWorkerName(null)}>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Confirm mock paid
          </Button>
        </div>
      </Modal>
    </>
  )
}

function HistoryCard({ title, entries }: { title: string; entries: string[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Mock settlement entries</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {entries.map((entry) => (
          <div key={entry} className="rounded-md border bg-background p-3 text-sm">
            {entry}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

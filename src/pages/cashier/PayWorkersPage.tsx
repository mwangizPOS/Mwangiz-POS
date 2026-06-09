import { useMemo, useState } from 'react'
import { BadgeDollarSign, CheckCircle2, Search, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { Modal } from '@/components/app/Modal'
import { SectionHeader } from '@/components/app/SectionHeader'
import { SimpleTabs } from '@/components/app/SimpleTabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useWorkerEarningsProjection } from '@/hooks/useWorkerEarningsProjection'
import { useReferenceData } from '@/hooks/useReferenceData'
import { formatMoney } from './cashierSaleLogic'

type SettlementTab = 'Pending' | 'Paid'

export function PayWorkersPage() {
  const [activeTab, setActiveTab] = useState<SettlementTab>('Pending')
  const [query, setQuery] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null)
  const [paidWorkerName, setPaidWorkerName] = useState<string | null>(null)
  
  const { earnings, isLoading: loadingEarnings } = useWorkerEarningsProjection()
  const { workers, isLoading: loadingWorkers } = useReferenceData()

  const safeWorkers = (workers as any[]) ?? []
  
  const filteredWorkers = useMemo(() => {
    return earnings.filter((earning) => {
      // Logic for Pending vs Paid: if unpaid_earnings > 0, it's pending. If unpaid == 0 but paid > 0, it's paid.
      // But activeTab filter:
      if (activeTab === 'Pending' && earning.unpaid_earnings <= 0) return false
      if (activeTab === 'Paid' && earning.paid_earnings <= 0) return false

      const workerInfo = safeWorkers.find(w => w.id === earning.worker_id)
      const workerName = workerInfo?.full_name || 'Unknown'

      const matchesQuery = workerName.toLowerCase().includes(query.toLowerCase())
      return matchesQuery
    })
  }, [activeTab, query, earnings, safeWorkers])

  function getWorkerName(workerId: string) {
    return safeWorkers.find(w => w.id === workerId)?.full_name || 'Unknown Worker'
  }

  if (loadingEarnings || loadingWorkers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
            { id: 'Pending', label: 'Pending', count: earnings.filter(e => e.unpaid_earnings > 0).length },
            { id: 'Paid', label: 'Paid', count: earnings.filter(e => e.paid_earnings > 0).length },
          ]}
        />
        <div />
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
              placeholder="Worker name"
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
            <Card key={worker.worker_id}>
              <CardContent className="grid gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/12 text-primary">
                    <BadgeDollarSign className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{getWorkerName(worker.worker_id)}</p>
                    <p className="truncate text-sm text-secondary-foreground">Worker</p>
                  </div>
                  <Badge variant={activeTab === 'Pending' ? 'orange' : 'default'}>{activeTab}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-secondary-foreground">
                  <span>{activeTab === 'Pending' ? 'Outstanding balance' : 'Paid history'}</span>
                  <span className="text-right">{new Date(worker.last_updated).toLocaleDateString()}</span>
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
        title={selectedWorker ? getWorkerName(selectedWorker.worker_id) : 'Worker'}
        description="Settlement detail"
        onClose={() => setSelectedWorker(null)}
      >
        {selectedWorker ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailTile label="Outstanding" value={formatMoney(selectedWorker.unpaid_earnings)} />
              <DetailTile label="Total earned" value={formatMoney(selectedWorker.total_earnings)} />
              <DetailTile label="Last update" value={new Date(selectedWorker.last_updated).toLocaleDateString()} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <HistoryCard title="Pending history" entries={[`Current balance ${formatMoney(selectedWorker.unpaid_earnings)}`]} />
              <HistoryCard title="Paid history" entries={[`Total paid ${formatMoney(selectedWorker.paid_earnings)}`]} />
            </div>
            <Button type="button" variant="orange" onClick={() => setPaidWorkerName(getWorkerName(selectedWorker.worker_id))}>
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

import { useMemo, useState } from 'react'
import { Eye, RotateCcw, Search } from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { Modal } from '@/components/app/Modal'
import { SectionHeader } from '@/components/app/SectionHeader'
import { SimpleTabs } from '@/components/app/SimpleTabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { paymentLogs, refundRequests } from '@/pages/mockData'

type RefundTab = 'Pending' | 'Approved' | 'Rejected'
type RefundType = 'Full Refund' | 'Item Refund' | 'Partial Item Refund'

export function RefundsPage() {
  const [activeTab, setActiveTab] = useState<RefundTab>('Pending')
  const [query, setQuery] = useState('')
  const [saleQuery, setSaleQuery] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState(paymentLogs[0]?.receipt ?? '')
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null)
  const [refundType, setRefundType] = useState<RefundType>('Item Refund')
  const [targetItem, setTargetItem] = useState(paymentLogs[0]?.items[0] ?? '')
  const [refundAmount, setRefundAmount] = useState('')
  const [reason, setReason] = useState('')
  const [createdPendingRequest, setCreatedPendingRequest] = useState(false)
  const selectedSale = paymentLogs.find((sale) => sale.receipt === selectedReceipt) ?? paymentLogs[0]
  const filteredSales = useMemo(
    () =>
      paymentLogs.filter((sale) =>
        `${sale.receipt} ${sale.clients.join(' ')} ${sale.items.join(' ')}`.toLowerCase().includes(saleQuery.toLowerCase()),
      ),
    [saleQuery],
  )
  const filteredRefunds = useMemo(
    () =>
      refundRequests.filter((refund) => {
        const haystack = `${refund.id} ${refund.receipt} ${refund.client} ${refund.service} ${refund.reason}`.toLowerCase()
        return refund.status === activeTab && haystack.includes(query.toLowerCase())
      }),
    [activeTab, query],
  )
  const selectedRefund = refundRequests.find((refund) => refund.id === selectedRefundId)

  function selectSale(receipt: string) {
    const sale = paymentLogs.find((item) => item.receipt === receipt)
    setSelectedReceipt(receipt)
    setTargetItem(sale?.items[0] ?? '')
    setCreatedPendingRequest(false)
  }

  function createRefundRequest() {
    setCreatedPendingRequest(true)
  }

  return (
    <>
      <SectionHeader
        eyebrow="Refunds"
        title="Create refund request"
        description="Find the receipt, select the sale or item, and submit a pending request."
      />

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Search Sale</CardTitle>
            <CardDescription>Receipt lookup</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="text-sm font-medium" htmlFor="sale-lookup">
              Receipt search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="sale-lookup"
                value={saleQuery}
                onChange={(event) => setSaleQuery(event.target.value)}
                placeholder="Receipt, client, service"
                className="pl-10"
              />
            </div>
            <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
              {filteredSales.map((sale) => (
                <button
                  key={sale.receipt}
                  type="button"
                  onClick={() => selectSale(sale.receipt)}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    selectedReceipt === sale.receipt ? 'border-primary bg-primary/10' : 'bg-background hover:bg-surface-alt'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{sale.receipt}</span>
                    <Badge variant={sale.status === 'Paid' ? 'default' : 'outline'}>{sale.status}</Badge>
                  </div>
                  <p className="mt-1 text-secondary-foreground">{sale.amount}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{selectedSale.receipt}</CardTitle>
                <CardDescription>{selectedSale.date}</CardDescription>
              </div>
              <Badge variant="outline">{selectedSale.method}</Badge>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {selectedSale.clients.map((client) => (
                  <Badge key={client} variant="outline">{client}</Badge>
                ))}
              </div>
              <div className="grid gap-2">
                {selectedSale.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTargetItem(item)}
                    className={`rounded-md border p-3 text-left text-sm transition-colors ${
                      targetItem === item ? 'border-primary bg-primary/10' : 'bg-background hover:bg-surface-alt'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refund Request</CardTitle>
              <CardDescription>Cashier requests remain pending for manager review.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="refund-type">
                  Refund type
                </label>
                <select
                  id="refund-type"
                  value={refundType}
                  onChange={(event) => setRefundType(event.target.value as RefundType)}
                  className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
                >
                  {['Full Refund', 'Item Refund', 'Partial Item Refund'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="refund-target">
                  Target
                </label>
                <select
                  id="refund-target"
                  value={targetItem}
                  disabled={refundType === 'Full Refund'}
                  onChange={(event) => setTargetItem(event.target.value)}
                  className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:opacity-60"
                >
                  {selectedSale.items.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="refund-amount">
                  Amount
                </label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0}
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  placeholder="1200"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="refund-reason">
                  Reason
                </label>
                <Input
                  id="refund-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Client disputed one service"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="button" disabled={!reason.trim()} onClick={createRefundRequest}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Submit Pending Request
                </Button>
                {createdPendingRequest ? (
                  <Badge variant="orange" className="ml-3">Pending</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-5 grid gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <SimpleTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'Pending', label: 'Pending', count: refundRequests.filter((item) => item.status === 'Pending').length },
              { id: 'Approved', label: 'Approved', count: refundRequests.filter((item) => item.status === 'Approved').length },
              { id: 'Rejected', label: 'Rejected', count: refundRequests.filter((item) => item.status === 'Rejected').length },
            ]}
          />
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="refund-search">
              Search requests
            </label>
            <Input id="refund-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Refund, receipt, service" />
          </div>
        </div>

        {filteredRefunds.length === 0 ? (
          <EmptyState icon={RotateCcw} title="No refund requests found" description="Try another status or search term." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-surface-alt text-xs text-secondary-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Refund</th>
                      <th className="px-4 py-3 font-medium">Receipt</th>
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRefunds.map((refund) => (
                      <tr key={refund.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{refund.id}</td>
                        <td className="px-4 py-3 text-secondary-foreground">{refund.receipt}</td>
                        <td className="px-4 py-3">{refund.service}</td>
                        <td className="px-4 py-3">{refund.amount}</td>
                        <td className="px-4 py-3">
                          <Badge variant={refund.status === 'Pending' ? 'orange' : refund.status === 'Approved' ? 'default' : 'outline'}>
                            {refund.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRefundId(refund.id)}>
                            <Eye className="size-4" aria-hidden="true" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <Modal
        open={Boolean(selectedRefund)}
        title={selectedRefund ? selectedRefund.id : 'Refund detail'}
        description="Pending cashier request"
        onClose={() => setSelectedRefundId(null)}
      >
        {selectedRefund ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile label="Receipt" value={selectedRefund.receipt} />
              <DetailTile label="Status" value={selectedRefund.status} />
              <DetailTile label="Client" value={selectedRefund.client} />
              <DetailTile label="Service" value={selectedRefund.service} />
              <DetailTile label="Amount" value={selectedRefund.amount} />
              <DetailTile label="Requested by" value={selectedRefund.requestedBy} />
            </div>
            <div className="rounded-md border bg-background p-4">
              <p className="text-sm font-medium">Reason</p>
              <p className="mt-2 text-sm leading-6 text-secondary-foreground">{selectedRefund.reason}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
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

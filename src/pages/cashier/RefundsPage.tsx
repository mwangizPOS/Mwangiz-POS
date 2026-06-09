import { useMemo, useState } from 'react'
import { Eye, RotateCcw, Search, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { Modal } from '@/components/app/Modal'
import { SectionHeader } from '@/components/app/SectionHeader'
import { SimpleTabs } from '@/components/app/SimpleTabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSalesProjection } from '@/hooks/useSalesProjection'
import { useRefundProjection } from '@/hooks/useRefundProjection'
import { saleService } from '@/services/frontend/saleService'
import { formatMoney } from './cashierSaleLogic'
import { useUiStore } from '@/store/uiStore'

type RefundTab = 'Pending' | 'Approved' | 'Rejected'
type RefundType = 'Full Refund' | 'Item Refund' | 'Partial Item Refund'

export function RefundsPage() {
  const [activeTab, setActiveTab] = useState<RefundTab>('Pending')
  const [query, setQuery] = useState('')
  const [saleQuery, setSaleQuery] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState('')
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null)
  const [refundType, setRefundType] = useState<RefundType>('Item Refund')
  const [targetItem, setTargetItem] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [reason, setReason] = useState('')
  const [createdPendingRequest, setCreatedPendingRequest] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentUser = useUiStore((state) => state.currentUser)

  const { sales: safeSales, isLoading: loadingSales } = useSalesProjection()
  const { refunds: safeRefunds, isLoading: loadingRefunds } = useRefundProjection()

  const selectedSale = safeSales.find((sale) => sale.sale_id === selectedReceipt)
  const filteredSales = useMemo(
    () =>
      safeSales.filter((sale) =>
        `${sale.sale_id}`.toLowerCase().includes(saleQuery.toLowerCase()),
      ),
    [saleQuery, safeSales],
  )
  const filteredRefunds = useMemo(
    () =>
      (safeRefunds as any[]).filter((refund) => {
        const haystack = `${refund.refund_id} ${refund.sale_id}`.toLowerCase()
        return refund.status === activeTab && haystack.includes(query.toLowerCase())
      }),
    [activeTab, query, safeRefunds],
  )
  const selectedRefund = (safeRefunds as any[]).find((refund) => refund.refund_id === selectedRefundId)

  function selectSale(receipt: string) {
    const sale = safeSales.find((item) => item.sale_id === receipt)
    setSelectedReceipt(receipt)
    setTargetItem(sale?.sale_items_projection?.[0]?.sale_item_id ?? '')
    setCreatedPendingRequest(false)
  }

  async function createRefundRequest() {
    if (!currentUser) return
    setIsSubmitting(true)
    try {
      await saleService.requestRefund({
        saleId: selectedReceipt,
        targetItemId: targetItem || undefined,
        amount: Number(refundAmount),
        reason,
        refundType
      }, '00000000-0000-0000-0000-000000000000', currentUser.id)
      setCreatedPendingRequest(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingSales || loadingRefunds) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
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
                  key={sale.sale_id}
                  type="button"
                  onClick={() => selectSale(sale.sale_id)}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    selectedReceipt === sale.sale_id ? 'border-primary bg-primary/10' : 'bg-background hover:bg-surface-alt'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{sale.sale_id.split('-')[0]}...</span>
                    <Badge variant={sale.status === 'Paid' ? 'default' : 'outline'}>{sale.status}</Badge>
                  </div>
                  <p className="mt-1 text-secondary-foreground">{formatMoney(sale.total_amount)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {selectedSale ? (
            <Card>
              <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{selectedSale.sale_id}</CardTitle>
                  <CardDescription>{new Date(selectedSale.created_at).toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant="outline">Total: {formatMoney(selectedSale.total_amount)}</Badge>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  {selectedSale.sale_items_projection?.map((item: any) => (
                    <button
                      key={item.sale_item_id}
                      type="button"
                      onClick={() => setTargetItem(item.sale_item_id)}
                      className={`rounded-md border p-3 text-left text-sm transition-colors ${
                        targetItem === item.sale_item_id ? 'border-primary bg-primary/10' : 'bg-background hover:bg-surface-alt'
                      }`}
                    >
                      Item: {item.sale_item_id} - {formatMoney(item.amount)}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select a sale</CardTitle>
                <CardDescription>Search and select a sale from the left panel.</CardDescription>
              </CardHeader>
            </Card>
          )}

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
                  {selectedSale?.sale_items_projection?.map((item: any) => (
                    <option key={item.sale_item_id} value={item.sale_item_id}>
                      {item.sale_item_id}
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
                <Button type="button" disabled={!reason.trim() || isSubmitting} onClick={createRefundRequest}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {isSubmitting ? 'Submitting...' : 'Submit Pending Request'}
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
              { id: 'Pending', label: 'Pending', count: (safeRefunds as any[]).filter((item: any) => item.status === 'Pending').length },
              { id: 'Approved', label: 'Approved', count: (safeRefunds as any[]).filter((item: any) => item.status === 'Approved').length },
              { id: 'Rejected', label: 'Rejected', count: (safeRefunds as any[]).filter((item: any) => item.status === 'Rejected').length },
            ]}
          />
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="refund-search">
              Search requests
            </label>
            <Input id="refund-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Refund ID" />
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
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRefunds.map((refund: any) => (
                      <tr key={refund.refund_id} className="border-t">
                        <td className="px-4 py-3 font-medium">{refund.refund_id.split('-')[0]}</td>
                        <td className="px-4 py-3 text-secondary-foreground">{refund.sale_id.split('-')[0]}</td>
                        <td className="px-4 py-3">{formatMoney(refund.amount)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={refund.status === 'Pending' ? 'orange' : refund.status === 'Approved' ? 'default' : 'outline'}>
                            {refund.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRefundId(refund.refund_id)}>
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
        title={selectedRefund ? selectedRefund.refund_id : 'Refund detail'}
        description="Pending cashier request"
        onClose={() => setSelectedRefundId(null)}
      >
        {selectedRefund ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile label="Receipt" value={selectedRefund.sale_id} />
              <DetailTile label="Status" value={selectedRefund.status} />
              <DetailTile label="Amount" value={formatMoney(selectedRefund.amount)} />
            </div>
            <div className="rounded-md border bg-background p-4">
              <p className="text-sm font-medium">Type</p>
              <p className="mt-2 text-sm leading-6 text-secondary-foreground">{selectedRefund.type}</p>
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

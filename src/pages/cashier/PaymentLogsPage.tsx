import { useMemo, useState } from 'react'
import { Eye, ReceiptText, Search, Loader2 } from 'lucide-react'
import { Modal } from '@/components/app/Modal'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSalesProjection } from '@/hooks/useSalesProjection'
import { formatMoney } from './cashierSaleLogic'

export function PaymentLogsPage() {
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)
  
  const { sales: safeSales, isLoading } = useSalesProjection()

  const filteredLogs = useMemo(() => {
    return safeSales.filter((sale) => {
      const haystack = `${sale.sale_id} ${sale.status} ${sale.created_at}`.toLowerCase()
      const matchesQuery = haystack.includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'All' || sale.status === statusFilter
      // Method is not in projection, so ignore method filter for now
      const matchesMethod = true

      // date filter logic
      let matchesDate = true
      if (dateFilter === 'Today') {
        const today = new Date().toDateString()
        const saleDate = new Date(sale.created_at).toDateString()
        matchesDate = today === saleDate
      } else if (dateFilter === 'Yesterday') {
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const saleDate = new Date(sale.created_at).toDateString()
        matchesDate = yesterday === saleDate
      }

      return matchesQuery && matchesMethod && matchesStatus && matchesDate
    })
  }, [dateFilter, methodFilter, query, statusFilter, safeSales])

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
        eyebrow="Payment Logs"
        title="Receipts and completed sales"
        description="Search and filtering UI for cashier receipts."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="receipt-search">
              Receipt search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="receipt-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Receipt or status"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="method-filter">
              Payment method
            </label>
            <select
              id="method-filter"
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
              disabled
            >
              {['All', 'Cash', 'M-Pesa', 'Bank', 'Mixed'].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
            >
              {['All', 'Paid', 'Pending', 'Partially refunded'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="date-filter">
              Date
            </label>
            <select
              id="date-filter"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
            >
              {['All', 'Today', 'Yesterday'].map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Receipt Number</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">No receipts found.</td>
                  </tr>
                ) : null}
                {filteredLogs.map((sale) => (
                  <tr key={sale.sale_id} className="border-t">
                    <td className="px-4 py-3 font-medium">{sale.sale_id.split('-')[0]}...</td>
                    <td className="px-4 py-3 text-secondary-foreground">{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{formatMoney(sale.total_amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={sale.status === 'Paid' ? 'default' : 'outline'}>{sale.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedReceipt(sale)}>
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

      <Modal
        open={Boolean(selectedReceipt)}
        title={selectedReceipt ? selectedReceipt.sale_id.split('-')[0] : 'Receipt'}
        description="Sale receipt details"
        onClose={() => setSelectedReceipt(null)}
      >
        {selectedReceipt ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile label="Date" value={new Date(selectedReceipt.created_at).toLocaleString()} />
              <DetailTile label="Amount" value={formatMoney(selectedReceipt.total_amount)} />
              <DetailTile label="Status" value={selectedReceipt.status} />
            </div>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>SaleItem receipt lines</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {selectedReceipt.sale_items_projection?.map((item: any) => (
                  <div key={item.sale_item_id} className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <ReceiptText className="size-4 text-primary" aria-hidden="true" />
                      <span>Item: {item.sale_item_id.split('-')[0]}</span>
                    </div>
                    <span className="font-semibold">{formatMoney(item.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
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

import { useMemo, useState } from 'react'
import { Eye, ReceiptText, Search } from 'lucide-react'
import { Modal } from '@/components/app/Modal'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { paymentLogs } from '@/pages/mockData'

export function PaymentLogsPage() {
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [selectedReceipt, setSelectedReceipt] = useState<(typeof paymentLogs)[number] | null>(null)
  const filteredLogs = useMemo(
    () =>
      paymentLogs.filter((log) => {
        const haystack = `${log.receipt} ${log.method} ${log.status} ${log.date}`.toLowerCase()
        const matchesQuery = haystack.includes(query.toLowerCase())
        const matchesMethod = methodFilter === 'All' || log.method === methodFilter
        const matchesStatus = statusFilter === 'All' || log.status === statusFilter
        const matchesDate =
          dateFilter === 'All' ||
          (dateFilter === 'Today' && log.date.includes('Today')) ||
          (dateFilter === 'Yesterday' && log.date.includes('Yesterday'))

        return matchesQuery && matchesMethod && matchesStatus && matchesDate
      }),
    [dateFilter, methodFilter, query, statusFilter],
  )

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
                placeholder="Receipt, method, or status"
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
          <div className="overflow-hidden rounded-lg">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Receipt Number</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.receipt} className="border-t">
                    <td className="px-4 py-3 font-medium">{log.receipt}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{log.date}</td>
                    <td className="px-4 py-3">{log.amount}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{log.method}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.status === 'Paid' ? 'default' : 'outline'}>{log.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedReceipt(log)}>
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
        title={selectedReceipt?.receipt ?? 'Receipt'}
        description="Mock receipt view"
        onClose={() => setSelectedReceipt(null)}
      >
        {selectedReceipt ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile label="Date" value={selectedReceipt.date} />
              <DetailTile label="Amount" value={selectedReceipt.amount} />
              <DetailTile label="Payment Method" value={selectedReceipt.method} />
              <DetailTile label="Status" value={selectedReceipt.status} />
            </div>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>Lightweight labels inside this sale</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {selectedReceipt.clients.map((client) => (
                  <Badge key={client} variant="outline">{client}</Badge>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>SaleItem receipt lines</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {selectedReceipt.items.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border bg-background p-3 text-sm">
                    <ReceiptText className="size-4 text-primary" aria-hidden="true" />
                    <span>{item}</span>
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

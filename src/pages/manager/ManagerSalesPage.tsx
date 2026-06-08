import { useState } from 'react'
import { Eye, Search, SlidersHorizontal } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Modal } from '@/components/app/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { recentSales } from '@/pages/mockData'

export function ManagerSalesPage() {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const selectedSale = recentSales.find((sale) => sale.receipt === selectedReceipt)

  return (
    <>
      <SectionHeader
        eyebrow="Sales"
        title="Branch sales"
        description="All mock sales for the selected branch."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search receipt, client, worker, service" className="pl-10" />
          </div>
          <Button type="button" variant="outline">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <Card>
          <CardContent className="p-0">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Receipt</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.receipt} className="border-t">
                    <td className="px-4 py-3 font-medium">{sale.receipt}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{sale.client}</td>
                    <td className="px-4 py-3">{sale.amount}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{sale.method}</td>
                    <td className="px-4 py-3">
                      <Badge variant={sale.status === 'Paid' ? 'default' : 'outline'}>{sale.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedReceipt(sale.receipt)}>
                        <Eye className="size-4" aria-hidden="true" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Modal
          open={!!selectedSale}
          onClose={() => setSelectedReceipt(null)}
          title="Sale detail"
          description={selectedSale?.receipt ?? 'No sale selected'}
        >
          {selectedSale ? (
            <div className="grid gap-3">
              <DetailRow label="Client" value={selectedSale.client} />
              <DetailRow label="Amount" value={selectedSale.amount} />
              <DetailRow label="Payment" value={selectedSale.method} />
              <DetailRow label="Status" value={selectedSale.status} />
              <div className="rounded-md border bg-background p-3">
                <p className="text-sm font-medium">SaleItems</p>
                <p className="mt-1 text-sm text-secondary-foreground">
                  Mock drawer prepared for item-level service and worker lines.
                </p>
              </div>
            </div>
          ) : null}
        </Modal>
      </section>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm">
      <span className="text-secondary-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

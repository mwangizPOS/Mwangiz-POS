import { useState, useMemo } from 'react'
import { Eye, Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Modal } from '@/components/app/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSalesProjection } from '@/hooks/useSalesProjection'
import { formatMoney } from '@/pages/cashier/cashierSaleLogic'

export function ManagerSalesPage() {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const { sales, isLoading } = useSalesProjection()

  const selectedSale = sales.find((sale) => sale.sale_id === selectedReceipt)

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const q = query.toLowerCase()
      const searchString = `${sale.sale_id} ${sale.status} ${sale.total_amount}`.toLowerCase()
      return searchString.includes(q)
    })
  }, [sales, query])

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
        eyebrow="Sales"
        title="Branch sales"
        description="All sales for the selected branch derived from projections."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search receipt or status" 
              className="pl-10" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" disabled>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-surface-alt text-xs text-secondary-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Receipt</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">No sales found.</td>
                    </tr>
                  ) : null}
                  {filteredSales.map((sale) => (
                    <tr key={sale.sale_id} className="border-t">
                      <td className="px-4 py-3 font-medium">{sale.sale_id.split('-')[0]}...</td>
                      <td className="px-4 py-3 text-secondary-foreground">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{formatMoney(sale.total_amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={sale.status === 'Paid' ? 'default' : 'outline'}>{sale.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedReceipt(sale.sale_id)}>
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
          open={!!selectedSale}
          onClose={() => setSelectedReceipt(null)}
          title="Sale detail"
          description={selectedSale ? selectedSale.sale_id.split('-')[0] : 'No sale selected'}
        >
          {selectedSale ? (
            <div className="grid gap-3">
              <DetailRow label="Date" value={new Date(selectedSale.created_at).toLocaleString()} />
              <DetailRow label="Amount" value={formatMoney(selectedSale.total_amount)} />
              <DetailRow label="Status" value={selectedSale.status} />
              <div className="rounded-md border bg-background p-3">
                <p className="text-sm font-medium">SaleItems ({selectedSale.sale_items_projection?.length || 0})</p>
                <div className="mt-2 grid gap-2">
                  {selectedSale.sale_items_projection?.map((item: any) => (
                    <div key={item.sale_item_id} className="flex justify-between text-sm">
                      <span className="text-secondary-foreground">Item: {item.sale_item_id.split('-')[0]}</span>
                      <span className="font-semibold">{formatMoney(item.amount)}</span>
                    </div>
                  ))}
                </div>
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

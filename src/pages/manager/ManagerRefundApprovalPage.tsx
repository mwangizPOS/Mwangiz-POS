import { useMemo, useState } from 'react'
import { Check, Eye, Search, X } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { SimpleTabs } from '@/components/app/SimpleTabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { refundRequests } from '@/pages/mockData'

type RefundTab = 'Pending' | 'Approved' | 'Rejected'

export function ManagerRefundApprovalPage() {
  const [activeTab, setActiveTab] = useState<RefundTab>('Pending')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRefunds = useMemo(() => {
    let list = refundRequests.filter((refund) => refund.status === activeTab)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (refund) =>
          refund.receipt.toLowerCase().includes(q) ||
          refund.client.toLowerCase().includes(q) ||
          refund.service.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeTab, searchQuery])

  return (
    <>
      <SectionHeader
        eyebrow="Refund Approval"
        title="Review refund requests"
        description="Approve or reject cashier-created requests."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SimpleTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'Pending', label: 'Pending', count: refundRequests.filter((item) => item.status === 'Pending').length },
            { id: 'Approved', label: 'Approved', count: refundRequests.filter((item) => item.status === 'Approved').length },
            { id: 'Rejected', label: 'Rejected', count: refundRequests.filter((item) => item.status === 'Rejected').length },
          ]}
        />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search receipt, client, service" 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <section className="grid gap-3">
        {filteredRefunds.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-secondary-foreground">
            No refund requests found.
          </div>
        ) : (
          filteredRefunds.map((refund) => (
            <Card key={refund.id}>
              <CardContent className="grid gap-4 p-5 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{refund.id}</p>
                    <Badge variant={refund.status === 'Pending' ? 'orange' : refund.status === 'Approved' ? 'default' : 'outline'}>
                      {refund.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-secondary-foreground">
                    {refund.receipt} · {refund.client} · {refund.service} · {refund.amount}
                  </p>
                  <p className="mt-1 text-sm text-secondary-foreground">{refund.reason}</p>
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Button type="button" variant="outline">
                    <Eye className="size-4" aria-hidden="true" />
                    View Details
                  </Button>
                  {refund.status === 'Pending' ? (
                    <>
                      <Button type="button">
                        <Check className="size-4" aria-hidden="true" />
                        Approve
                      </Button>
                      <Button type="button" variant="outline">
                        <X className="size-4" aria-hidden="true" />
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </>
  )
}

import { useMemo, useState } from 'react'
import { Check, Eye, Search, X } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { SimpleTabs } from '@/components/app/SimpleTabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRefundProjection } from '@/hooks/useRefundProjection'
import { managerService } from '@/services/frontend/managerService'
import { formatMoney } from '@/pages/cashier/cashierSaleLogic'
import { useUiStore } from '@/store/uiStore'

type RefundTab = 'Pending' | 'Approved' | 'Rejected'

export function ManagerRefundApprovalPage() {
  const [activeTab, setActiveTab] = useState<RefundTab>('Pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  const { refunds: safeRefunds, isLoading } = useRefundProjection()
  const currentUser = useUiStore((state) => state.currentUser)

  const filteredRefunds = useMemo(() => {
    let list = safeRefunds.filter((refund: any) => refund.status === activeTab)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (refund: any) =>
          refund.sale_id.toLowerCase().includes(q) ||
          refund.refund_id.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeTab, searchQuery, safeRefunds])

  async function handleApprove(refundId: string, saleId: string) {
    if (!currentUser) return
    setIsSubmitting(refundId)
    try {
      await managerService.approveRefund({
        refundId,
        saleId,
        approvedBy: currentUser.id
      }, '00000000-0000-0000-0000-000000000000', currentUser.id)
    } finally {
      setIsSubmitting(null)
    }
  }

  async function handleReject(refundId: string, saleId: string) {
    if (!currentUser) return
    setIsSubmitting(refundId)
    try {
      await managerService.rejectRefund({
        refundId,
        saleId,
        rejectedBy: currentUser.id,
        rejectionReason: 'Rejected by manager' // TODO: add a prompt/modal for reason
      }, '00000000-0000-0000-0000-000000000000', currentUser.id)
    } finally {
      setIsSubmitting(null)
    }
  }

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
            { id: 'Pending', label: 'Pending', count: safeRefunds.filter((item) => item.status === 'Pending').length },
            { id: 'Approved', label: 'Approved', count: safeRefunds.filter((item) => item.status === 'Approved').length },
            { id: 'Rejected', label: 'Rejected', count: safeRefunds.filter((item) => item.status === 'Rejected').length },
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
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-secondary-foreground">Loading...</p>
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-secondary-foreground">
            No refund requests found.
          </div>
        ) : (
          filteredRefunds.map((refund) => (
            <Card key={refund.refund_id}>
              <CardContent className="grid gap-4 p-5 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{refund.refund_id}</p>
                    <Badge variant={refund.status === 'Pending' ? 'orange' : refund.status === 'Approved' ? 'default' : 'outline'}>
                      {refund.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-secondary-foreground">
                    Receipt: {refund.sale_id} · Amount: {formatMoney(refund.amount)}
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
                      <Button 
                        type="button" 
                        disabled={isSubmitting === refund.refund_id}
                        onClick={() => handleApprove(refund.refund_id, refund.sale_id)}
                      >
                        <Check className="size-4" aria-hidden="true" />
                        Approve
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isSubmitting === refund.refund_id}
                        onClick={() => handleReject(refund.refund_id, refund.sale_id)}
                      >
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

import { useState } from 'react'
import { Building2, Edit, Plus, ToggleLeft, Loader2 } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Modal } from '@/components/app/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useBranchRevenueProjection } from '@/hooks/useBranchRevenueProjection'
import { formatMoney } from '@/pages/cashier/cashierSaleLogic'

export function BranchesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [mpesaEnabled, setMpesaEnabled] = useState(false)

  const { branches, isLoading: loadingBranches } = useReferenceData()
  const { branchRevenues, isLoading: loadingRevenues } = useBranchRevenueProjection()

  const safeBranches = (branches as any[]) ?? []

  if (loadingBranches || loadingRevenues) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <SectionHeader
        eyebrow="Branches"
        title="Business branches"
        description="Create, edit, disable, and review branch performance summaries."
        actions={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Create branch
          </Button>
        }
      />

      <section className="grid gap-3 xl:grid-cols-2">
        {safeBranches.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-secondary-foreground">
            No branches found.
          </div>
        ) : null}
        {safeBranches.map((branch) => {
          const rev = branchRevenues.find((r) => r.branch_id === branch.id)
          const revenueText = rev ? formatMoney(rev.net_revenue) : 'KES 0'
          return (
            <Card key={branch.id}>
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Building2 className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{branch.name}</p>
                      <Badge variant="outline">{branch.code}</Badge>
                      <Badge>{branch.active ? 'Active' : 'Disabled'}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-secondary-foreground">
                      Revenue: {revenueText}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button type="button" variant="outline">
                    <Edit className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline">
                    <ToggleLeft className="size-4" aria-hidden="true" />
                    Disable
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create branch" description="Set up a new branch with manager and cashier credentials.">
        <form className="grid gap-6" onSubmit={(e) => { e.preventDefault(); setIsCreateOpen(false) }}>
          
          <div className="grid gap-4 rounded-md border p-4">
            <h3 className="font-medium text-foreground">Branch Details</h3>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Branch Name</label>
              <Input placeholder="e.g. Westlands Branch" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Branch Color</label>
              <Input type="color" className="h-10 w-full p-1 cursor-pointer" defaultValue="#FF6B00" />
            </div>
          </div>

          <div className="grid gap-4 rounded-md border p-4">
            <h3 className="font-medium text-foreground">Payment Configuration</h3>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                className="rounded border-input text-primary focus:ring-primary h-4 w-4" 
                checked={mpesaEnabled}
                onChange={(e) => setMpesaEnabled(e.target.checked)}
              />
              <span>Enable M-Pesa Integration</span>
            </label>
            
            {mpesaEnabled && (
              <div className="grid gap-3 pt-2 pl-6 border-l-2 border-primary/20">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Shortcode</label>
                  <Input placeholder="e.g. 174379" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Passkey</label>
                  <Input type="password" placeholder="Enter passkey" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Till Number</label>
                  <Input placeholder="e.g. 543210" />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 rounded-md border p-4">
            <h3 className="font-medium text-foreground">Branch Staff Credentials</h3>
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-secondary-foreground">Branch Manager</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <Input type="email" placeholder="manager@branch.local" />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-foreground">Password</label>
                  <Input type="password" placeholder="Create password" />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-secondary-foreground">Branch Cashier</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <Input type="email" placeholder="cashier@branch.local" />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-foreground">Password</label>
                  <Input type="password" placeholder="Create password" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create Branch</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

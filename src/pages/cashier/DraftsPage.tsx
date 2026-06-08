import { useMemo, useState } from 'react'
import { FileText, Search, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/store/uiStore'
import { calculateSaleTotal, formatMoney } from './cashierSaleLogic'

export function DraftsPage() {
  const [query, setQuery] = useState('')
  const drafts = useUiStore((state) => state.cashierDrafts)
  const loadCashierDraft = useUiStore((state) => state.loadCashierDraft)
  const deleteCashierDraft = useUiStore((state) => state.deleteCashierDraft)
  const setActiveRoute = useUiStore((state) => state.setActiveRoute)
  const filteredDrafts = useMemo(
    () =>
      drafts.filter((draft) => {
        const clientLabels = draft.clients.map((client) => client.label).join(' ')
        return `${draft.saleNumber} ${clientLabels}`.toLowerCase().includes(query.toLowerCase())
      }),
    [drafts, query],
  )

  function openDraft(draftId: string) {
    loadCashierDraft(draftId)
    setActiveRoute('new-sale')
  }

  return (
    <>
      <SectionHeader
        eyebrow="Drafts"
        title="Saved sale drafts"
        description="Open a draft to continue Step 1: Build Sale."
        actions={
          <Button type="button" onClick={() => setActiveRoute('new-sale')}>
            <FileText className="size-4" aria-hidden="true" />
            Back to Build Sale
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <label className="mb-2 block text-sm font-medium" htmlFor="draft-search">
            Search drafts
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="draft-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sale number or client label"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredDrafts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No drafts found"
          description="Saved sale drafts will appear here."
          actionLabel="Create Sale"
          onAction={() => setActiveRoute('new-sale')}
        />
      ) : (
        <section className="grid gap-3">
          {filteredDrafts.map((draft) => {
            const total = calculateSaleTotal(draft.clients)
            const itemCount = draft.clients.reduce((sum, client) => sum + client.items.length, 0)

            return (
              <Card key={draft.id}>
                <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{draft.saleNumber}</p>
                      <Badge variant="outline">{draft.clients.length} clients</Badge>
                      <Badge variant="outline">{itemCount} services</Badge>
                    </div>
                    <p className="mt-2 truncate text-sm text-secondary-foreground">
                      {draft.clients.map((client) => client.label || 'Untitled client').join(', ')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-primary">{formatMoney(total)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button type="button" variant="outline" onClick={() => openDraft(draft.id)}>
                      Open draft
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => deleteCashierDraft(draft.id)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}
    </>
  )
}

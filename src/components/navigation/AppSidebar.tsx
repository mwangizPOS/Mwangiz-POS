import { getNavigationForRole, productIdentity, roleLabels } from '@/app/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export function AppSidebar() {
  const activeRoute = useUiStore((state) => state.activeRoute)
  const currentRole = useUiStore((state) => state.currentRole)
  const setActiveRoute = useUiStore((state) => state.setActiveRoute)
  const ProductIcon = productIdentity.icon
  const navigationItems = getNavigationForRole(currentRole)
  const sections = [...new Set(navigationItems.map((item) => item.section))]

  return (
    <aside className="hidden min-h-svh w-[272px] shrink-0 border-r bg-surface px-4 py-5 text-foreground lg:flex lg:flex-col">
      <div className="flex h-12 items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
          <ProductIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{productIdentity.name}</p>
          <p className="truncate text-xs text-secondary-foreground">{productIdentity.descriptor}</p>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="mb-3 rounded-lg border bg-background/70 p-3">
        <p className="text-xs text-muted-foreground">Workspace</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{roleLabels[currentRole]}</p>
          <Badge variant="outline">Mock</Badge>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="grid gap-1">
            <p className="px-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {section}
            </p>
            {navigationItems
              .filter((item) => item.section === section)
              .map((item) => {
                const Icon = item.icon
                const isActive = item.id === activeRoute

                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveRoute(item.id)}
                    className={cn(
                      'h-11 justify-start gap-3 rounded-md px-3 text-sm font-medium',
                      isActive
                        ? 'bg-primary text-primary-foreground hover:bg-primary-dark hover:text-primary-foreground'
                        : 'text-secondary-foreground hover:bg-surface-alt hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                )
              })}
          </div>
        ))}
      </nav>

      <div className="rounded-lg border bg-background/70 p-3">
        <p className="text-xs font-medium text-secondary-foreground">Production shell</p>
        <p className="mt-1 text-sm font-semibold text-foreground">Foundation v0.0.0</p>
      </div>
    </aside>
  )
}

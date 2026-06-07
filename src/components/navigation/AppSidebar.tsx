import { navigationItems, productIdentity } from '@/app/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export function AppSidebar() {
  const activeNavigationItem = useUiStore((state) => state.activeNavigationItem)
  const setActiveNavigationItem = useUiStore((state) => state.setActiveNavigationItem)
  const ProductIcon = productIdentity.icon

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

      <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeNavigationItem

          return (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              disabled={!item.enabled}
              onClick={() => item.enabled && setActiveNavigationItem(item.id)}
              className={cn(
                'h-11 justify-start gap-3 rounded-md px-3 text-sm font-medium',
                isActive
                  ? 'bg-primary text-primary-foreground hover:bg-primary-dark hover:text-primary-foreground'
                  : 'text-secondary-foreground hover:bg-surface-alt hover:text-foreground',
                !item.enabled && 'opacity-55',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      <div className="rounded-lg border bg-background/70 p-3">
        <p className="text-xs font-medium text-secondary-foreground">Production shell</p>
        <p className="mt-1 text-sm font-semibold text-foreground">Foundation v0.0.0</p>
      </div>
    </aside>
  )
}

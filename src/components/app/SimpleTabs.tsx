import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export type TabItem<T extends string> = {
  id: T
  label: string
  count?: number
}

type SimpleTabsProps<T extends string> = {
  tabs: TabItem<T>[]
  activeTab: T
  onChange: (tab: T) => void
}

export function SimpleTabs<T extends string>({ tabs, activeTab, onChange }: SimpleTabsProps<T>) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-lg border bg-surface p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            onClick={() => onChange(tab.id)}
            className={cn(
              'h-10 min-w-max flex-1 rounded-md px-3',
              isActive
                ? 'bg-primary text-primary-foreground hover:bg-primary-dark hover:text-primary-foreground'
                : 'text-secondary-foreground hover:bg-surface-alt hover:text-foreground',
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-xs">{tab.count}</span>
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}

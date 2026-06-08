import { ArrowDown, ArrowUp, EyeOff, Settings } from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUiStore, type DashboardWidgetId } from '@/store/uiStore'

const widgetLabels: Record<DashboardWidgetId, string> = {
  totalRevenue: 'Total Revenue KPI',
  totalSales: 'Total Sales KPI',
  totalBranches: 'Total Branches KPI',
  totalWorkers: 'Total Workers KPI',
  revenueTrend: 'Revenue Trend Graph',
  branchComparison: 'Branch Comparison Graph',
}

export function SettingsPage() {
  const dashboardWidgets = useUiStore((state) => state.dashboardWidgets)
  const hiddenDashboardWidgets = useUiStore((state) => state.hiddenDashboardWidgets)
  const toggleDashboardWidget = useUiStore((state) => state.toggleDashboardWidget)
  const moveDashboardWidget = useUiStore((state) => state.moveDashboardWidget)

  return (
    <>
      <SectionHeader
        eyebrow="Settings"
        title="Dashboard personalization"
        description="Local UI settings for SuperAdmin dashboard widgets."
        actions={<Badge variant="outline">Stored locally</Badge>}
      />

      <Card>
        <CardContent className="grid gap-3 p-5">
          {dashboardWidgets.map((widget, index) => {
            const isHidden = hiddenDashboardWidgets.includes(widget)

            return (
              <div key={widget} className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{widgetLabels[widget]}</p>
                  <p className="mt-1 text-sm text-secondary-foreground">
                    {isHidden ? 'Hidden from dashboard' : 'Visible on dashboard'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => moveDashboardWidget(widget, 'up')}>
                    <ArrowUp className="size-4" aria-hidden="true" />
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === dashboardWidgets.length - 1}
                    onClick={() => moveDashboardWidget(widget, 'down')}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                    Down
                  </Button>
                  <Button type="button" variant={isHidden ? 'default' : 'outline'} size="sm" onClick={() => toggleDashboardWidget(widget)}>
                    <EyeOff className="size-4" aria-hidden="true" />
                    {isHidden ? 'Show' : 'Hide'}
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {hiddenDashboardWidgets.length === dashboardWidgets.length ? (
        <EmptyState
          icon={Settings}
          title="All widgets hidden"
          description="At least one widget should be visible before production settings are enabled."
        />
      ) : null}
    </>
  )
}

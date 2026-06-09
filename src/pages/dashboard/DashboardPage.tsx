import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BadgeDollarSign,
  Building2,
  CreditCard,
  RefreshCcw,
  ReceiptText,
  RotateCcw,
  Scissors,
  TrendingUp,
  UsersRound,
  Loader2,
} from 'lucide-react'
import { MetricCard } from '@/components/app/MetricCard'
import { SectionHeader } from '@/components/app/SectionHeader'
import { SkeletonCard } from '@/components/app/Skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SystemRole } from '@/domain/enums'
import { useUiStore, type DashboardWidgetId } from '@/store/uiStore'
import { useSalesProjection } from '@/hooks/useSalesProjection'
import { useWorkerEarningsProjection } from '@/hooks/useWorkerEarningsProjection'
import { useBranchRevenueProjection } from '@/hooks/useBranchRevenueProjection'
import { useReferenceData } from '@/hooks/useReferenceData'
import { formatMoney } from '@/pages/cashier/cashierSaleLogic'

const cashierIcons = [CreditCard, ReceiptText, UsersRound, RotateCcw, RefreshCcw] as const
const managerIcons = [CreditCard, TrendingUp, ReceiptText, UsersRound] as const
const adminIcons = [CreditCard, ReceiptText, Building2, UsersRound] as const

export function DashboardPage() {
  const currentRole = useUiStore((state) => state.currentRole)

  if (currentRole === SystemRole.SuperAdmin) {
    return <SuperAdminDashboard />
  }

  if (currentRole === SystemRole.BranchManager) {
    return <BranchManagerDashboard />
  }

  return <CashierDashboard />
}

function CashierDashboard() {
  const { sales, isLoading: loadingSales } = useSalesProjection()
  const { workers } = useReferenceData()
  
  const safeWorkers = (workers as any[]) ?? []
  
  const todaySales = sales.filter(s => {
    const d = new Date(s.created_at)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })

  const totalSales = todaySales.length
  const grossRevenue = todaySales.reduce((sum, s) => sum + Number(s.subtotal), 0)
  const refundsProcessed = todaySales.reduce((sum, s) => sum + Number(s.refund_amount), 0)
  
  const cashierMetrics = [
    { label: 'Today\'s Sales', value: String(totalSales), context: 'Total transactions' },
    { label: 'Gross Revenue', value: formatMoney(grossRevenue), context: 'Before refunds' },
    { label: 'Refunds', value: formatMoney(refundsProcessed), context: 'Processed today' },
    { label: 'Active Workers', value: String(safeWorkers.filter(w => w.active).length), context: 'Branch' },
    { label: 'Pending Syncs', value: '0', context: 'Offline queue' },
  ]

  const recentSales = sales.slice(0, 5).map(s => ({
    receipt: s.sale_id.split('-')[0],
    client: 'Walk-in',
    amount: formatMoney(s.total_amount),
    method: s.payment_method || 'N/A',
    status: s.status,
    time: new Date(s.created_at).toLocaleTimeString()
  }))

  if (loadingSales) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <SectionHeader
        eyebrow="Cashier Dashboard"
        title="Today at Branch"
        description="Fast daily overview for the front desk."
        actions={<Badge variant="orange">Online-first</Badge>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cashierMetrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            context={metric.context}
            icon={cashierIcons[index]}
            tone={index === 3 ? 'pink' : index === 4 ? 'orange' : 'primary'}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest receipts from the cashier lane</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-surface-alt text-xs text-secondary-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Receipt</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Time</th>
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
                      <td className="px-4 py-3 text-secondary-foreground">{sale.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline Queue Status</CardTitle>
            <CardDescription>Local events waiting for server acceptance</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ['Pending events', '0'],
              ['Last sync', 'Just now'],
              ['Network mode', 'Stable'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md border bg-background px-3 py-3 text-sm">
                <span className="text-secondary-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
            <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">
              Offline entries stay temporary until the backend accepts them.
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function BranchManagerDashboard() {
  const { sales, isLoading: loadingSales } = useSalesProjection()
  const { workers, services, isLoading: loadingRefs } = useReferenceData()
  const { earnings } = useWorkerEarningsProjection()

  const safeWorkers = (workers as any[]) ?? []
  const safeServices = (services as any[]) ?? []

  const todaySales = sales.filter(s => {
    const d = new Date(s.created_at)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })

  const dailyRevenue = todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0)

  const managerMetrics = [
    { label: 'Daily Revenue', value: formatMoney(dailyRevenue), context: 'Net today' },
    { label: 'Branch Workers', value: String(safeWorkers.length), context: 'Total workers' },
    { label: 'Active Services', value: String(safeServices.filter(s => s.active).length), context: 'Catalog size' },
    { label: 'Sales Today', value: String(todaySales.length), context: 'Transaction count' },
  ]

  const revenueTrend = useMemo(() => {
    const trendMap = new Map<string, number>()
    sales.forEach((sale) => {
      if (sale.status === 'Cancelled' || sale.status === 'Failed') return
      const date = new Date(sale.created_at).toLocaleDateString(undefined, { weekday: 'short' })
      const current = trendMap.get(date) || 0
      trendMap.set(date, current + Number(sale.total_amount))
    })
    const result: { day: string; revenue: number }[] = []
    trendMap.forEach((revenue, day) => result.push({ day, revenue }))
    return result.length ? result : [{ day: 'No Data', revenue: 0 }]
  }, [sales])

  const topServices = useMemo(() => {
    const counts = new Map<string, number>()
    sales.forEach(sale => {
      if (sale.status === 'Cancelled' || sale.status === 'Failed') return
      sale.sale_items_projection?.forEach((item: any) => {
        const current = counts.get(item.service_id) || 0
        counts.set(item.service_id, current + 1)
      })
    })

    const result: { name: string; count: number }[] = []
    counts.forEach((count, serviceId) => {
      const svcInfo = safeServices.find(s => s.id === serviceId)
      result.push({ name: svcInfo?.name || 'Unknown', count })
    })
    return result.sort((a, b) => b.count - a.count).slice(0, 5)
  }, [sales, safeServices])

  const topWorkers = useMemo(() => {
    return earnings.map((e) => {
      const workerInfo = safeWorkers.find((w) => w.id === e.worker_id)
      return {
        name: workerInfo?.full_name || 'Unknown',
        sales: Number(e.total_earnings),
      }
    }).sort((a, b) => b.sales - a.sales).slice(0, 5)
  }, [earnings, safeWorkers])

  if (loadingSales || loadingRefs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <SectionHeader
        eyebrow="Branch Dashboard"
        title="Branch performance"
        description="Branch-scoped sales, workers, services, and refund activity."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {managerMetrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            context={metric.context}
            icon={managerIcons[index]}
            tone={index === 1 ? 'orange' : 'primary'}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.5fr)]">
        <RevenueTrendCard title="Revenue Trend" description="Branch revenue by day" data={revenueTrend} />
        <RankedListCard title="Top Services" description="SaleItem-derived service view" rows={topServices} />
      </section>

      <RankedListCard title="Top Workers" description="Worker earnings from SaleItems" rows={topWorkers} />
    </>
  )
}

function SuperAdminDashboard() {
  const dashboardWidgets = useUiStore((state) => state.dashboardWidgets)
  const hiddenDashboardWidgets = useUiStore((state) => state.hiddenDashboardWidgets)
  const visibleMetricIds = dashboardWidgets.filter((widget) => !hiddenDashboardWidgets.includes(widget))

  const { sales, isLoading: loadingSales } = useSalesProjection()
  const { workers, branches, isLoading: loadingRefs } = useReferenceData()
  const { branchRevenues } = useBranchRevenueProjection()

  const safeWorkers = (workers as any[]) ?? []
  const safeBranches = (branches as any[]) ?? []
  const globalRevenue = branchRevenues.reduce((sum: number, b: any) => sum + Number(b.net_revenue), 0)

  const adminMetrics = [
    { id: 'totalRevenue' as DashboardWidgetId, label: 'Global Revenue', value: formatMoney(globalRevenue), context: 'All branches' },
    { id: 'totalSales' as DashboardWidgetId, label: 'Total Sales', value: String(sales.length), context: 'All time' },
    { id: 'totalBranches' as DashboardWidgetId, label: 'Total Branches', value: String(safeBranches.length), context: 'Active & Inactive' },
    { id: 'totalWorkers' as DashboardWidgetId, label: 'Total Workers', value: String(safeWorkers.length), context: 'Across all branches' },
  ]

  const revenueTrend = useMemo(() => {
    const trendMap = new Map<string, number>()
    sales.forEach((sale) => {
      if (sale.status === 'Cancelled' || sale.status === 'Failed') return
      const date = new Date(sale.created_at).toLocaleDateString(undefined, { weekday: 'short' })
      const current = trendMap.get(date) || 0
      trendMap.set(date, current + Number(sale.total_amount))
    })
    const result: { day: string; revenue: number }[] = []
    trendMap.forEach((revenue, day) => result.push({ day, revenue }))
    return result.length ? result : [{ day: 'No Data', revenue: 0 }]
  }, [sales])

  const branchComparison = useMemo(() => {
    return branchRevenues.map((b) => {
      const branchInfo = safeBranches.find(br => br.id === b.branch_id)
      return {
        branch: branchInfo?.name || 'Unknown',
        revenue: Number(b.net_revenue)
      }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [branchRevenues, safeBranches])

  if (loadingSales || loadingRefs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <SectionHeader
        eyebrow="Super Admin Dashboard"
        title="Business overview"
        description="Global performance across all MWANGI'Z branches."
        actions={
          <>
            <Badge variant="secondary">Executive</Badge>
            <Badge variant="pink">Live analytics</Badge>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminMetrics
          .filter((metric) => visibleMetricIds.includes(metric.id))
          .map((metric, index) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              context={metric.context}
              icon={adminIcons[index] ?? BadgeDollarSign}
              tone={index === 2 ? 'orange' : 'primary'}
            />
          ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)]">
        {!hiddenDashboardWidgets.includes('revenueTrend') ? (
          <RevenueTrendCard title="Revenue Trend Graph" description="Global revenue by day" data={revenueTrend} />
        ) : (
          <SkeletonCard />
        )}
        {!hiddenDashboardWidgets.includes('branchComparison') ? <BranchComparisonCard data={branchComparison} /> : <SkeletonCard />}
      </section>

      <RankedListCard title="Top Branches" description="Revenue ranking" rows={branchComparison} />
    </>
  )
}

function RevenueTrendCard({ title, description, data }: { title: string; description: string; data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.38} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={48} />
            <ChartTooltip
              cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--popover-foreground)',
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={3}
              fill="url(#revenueFill)"
              activeDot={{ r: 5, fill: 'var(--orange)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function BranchComparisonCard({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch Comparison Graph</CardTitle>
        <CardDescription>Revenue by branch</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="branch" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={48} />
            <ChartTooltip
              cursor={{ fill: 'rgba(245, 197, 66, 0.08)' }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--popover-foreground)',
              }}
            />
            <Bar dataKey="revenue" radius={[8, 8, 2, 2]} fill="var(--orange)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

type RankedRow = {
  name?: string
  branch?: string
  count?: number
  sales?: number
  revenue?: string | number
  earnings?: string
}

function RankedListCard({ title, description, rows }: { title: string; description: string; rows: RankedRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {rows.length === 0 ? <p className="text-sm text-muted-foreground p-3">No data</p> : null}
          {rows.map((row, index) => (
            <div key={`${row.name ?? row.branch}-${index}`} className="flex items-center gap-3 rounded-md border bg-background p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/12 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.name ?? row.branch}</p>
                <p className="mt-1 text-xs text-secondary-foreground">
                  {row.count ?? row.sales ?? 'Revenue'} {typeof row.revenue === 'number' ? `${formatMoney(row.revenue)}` : row.revenue ?? row.earnings}
                </p>
              </div>
              <Scissors className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

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
import { useUiStore } from '@/store/uiStore'
import {
  adminMetrics,
  branchComparison,
  cashierMetrics,
  managerMetrics,
  recentSales,
  revenueTrend,
  topServices,
  topWorkers,
} from '@/pages/mockData'

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
  return (
    <>
      <SectionHeader
        eyebrow="Cashier Dashboard"
        title="Today at Nairobi HQ"
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
            <CardDescription>Latest mock receipts from the cashier lane</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
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
              ['Pending events', '3'],
              ['Last sync', '4 minutes ago'],
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
  return (
    <>
      <SectionHeader
        eyebrow="Branch Dashboard"
        title="Nairobi HQ performance"
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
        <RevenueTrendCard title="Revenue Trend" description="Mock branch revenue by day" />
        <RankedListCard title="Top Services" description="SaleItem-derived service view" rows={topServices} />
      </section>

      <RankedListCard title="Top Workers" description="Worker performance from SaleItems" rows={topWorkers} />
    </>
  )
}

function SuperAdminDashboard() {
  const dashboardWidgets = useUiStore((state) => state.dashboardWidgets)
  const hiddenDashboardWidgets = useUiStore((state) => state.hiddenDashboardWidgets)
  const visibleMetricIds = dashboardWidgets.filter((widget) => !hiddenDashboardWidgets.includes(widget))

  return (
    <>
      <SectionHeader
        eyebrow="Super Admin Dashboard"
        title="Business overview"
        description="Global performance across all MWANGI'Z branches."
        actions={
          <>
            <Badge variant="secondary">Executive</Badge>
            <Badge variant="pink">Mock analytics</Badge>
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
          <RevenueTrendCard title="Revenue Trend Graph" description="Global mock revenue by day" />
        ) : (
          <SkeletonCard />
        )}
        {!hiddenDashboardWidgets.includes('branchComparison') ? <BranchComparisonCard /> : <SkeletonCard />}
      </section>

      <RankedListCard title="Top Branches" description="Mock revenue ranking" rows={branchComparison} />
    </>
  )
}

function RevenueTrendCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueTrend} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
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

function BranchComparisonCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch Comparison Graph</CardTitle>
        <CardDescription>Mock revenue by branch</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={branchComparison} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
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
          {rows.map((row, index) => (
            <div key={`${row.name ?? row.branch}-${index}`} className="flex items-center gap-3 rounded-md border bg-background p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/12 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.name ?? row.branch}</p>
                <p className="mt-1 text-xs text-secondary-foreground">
                  {row.count ?? row.sales ?? 'Revenue'} {typeof row.revenue === 'number' ? `KES ${row.revenue.toLocaleString()}` : row.revenue ?? row.earnings}
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

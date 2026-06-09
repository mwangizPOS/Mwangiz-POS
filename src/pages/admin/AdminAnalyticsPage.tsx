import { useState, useMemo } from 'react'
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
import { SectionHeader } from '@/components/app/SectionHeader'
import { TimeframeSelector, type Timeframe } from '@/components/app/TimeframeSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalesProjection } from '@/hooks/useSalesProjection'
import { useWorkerEarningsProjection } from '@/hooks/useWorkerEarningsProjection'
import { useBranchRevenueProjection } from '@/hooks/useBranchRevenueProjection'
import { useReferenceData } from '@/hooks/useReferenceData'

export function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('month')
  
  const { sales } = useSalesProjection()
  const { earnings } = useWorkerEarningsProjection()
  const { branchRevenues } = useBranchRevenueProjection()
  const { workers, branches, services } = useReferenceData()

  const safeWorkers = (workers as any[]) ?? []
  const safeBranches = (branches as any[]) ?? []
  const safeServices = (services as any[]) ?? []

  const revenueTrend = useMemo(() => {
    const trendMap = new Map<string, number>()
    sales.forEach((sale) => {
      if (sale.status === 'Cancelled' || sale.status === 'Failed') return
      const date = new Date(sale.created_at).toLocaleDateString(undefined, { weekday: 'short' })
      const current = trendMap.get(date) || 0
      trendMap.set(date, current + Number(sale.total_amount))
    })

    const result: { day: string; revenue: number }[] = []
    trendMap.forEach((revenue, day) => {
      result.push({ day, revenue })
    })
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
        sales: Number(e.total_earnings), // mapping earnings to the 'sales' bar for simplicity
      }
    }).sort((a, b) => b.sales - a.sales).slice(0, 5)
  }, [earnings, safeWorkers])

  return (
    <>
      <SectionHeader
        eyebrow="Analytics"
        title="Business intelligence"
        description="Revenue, branch, service, and worker performance views derived from projections."
      />

      <div className="mb-4">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Revenue Trends" description="Global revenue trend">
          <AreaChart data={revenueTrend} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={48} />
            <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fill="var(--primary)" fillOpacity={0.18} />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Branch Performance" description="Branch net revenue comparison">
          <BarChart data={branchComparison} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="branch" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={48} />
            <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Bar dataKey="revenue" radius={[8, 8, 2, 2]} fill="var(--orange)" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Service Performance" description="SaleItem service attribution counts">
          <BarChart data={topServices} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={36} />
            <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Bar dataKey="count" radius={[8, 8, 2, 2]} fill="var(--primary)" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Worker Performance" description="Worker total earnings">
          <BarChart data={topWorkers} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={36} />
            <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Bar dataKey="sales" radius={[8, 8, 2, 2]} fill="var(--pink)" />
          </BarChart>
        </ChartCard>
      </section>
    </>
  )
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

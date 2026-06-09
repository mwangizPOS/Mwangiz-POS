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
import { SectionHeader } from '@/components/app/SectionHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalesProjection } from '@/hooks/useSalesProjection'
import { useWorkerEarningsProjection } from '@/hooks/useWorkerEarningsProjection'
import { useReferenceData } from '@/hooks/useReferenceData'

export function ManagerReportsPage() {
  const { sales } = useSalesProjection()
  const { earnings } = useWorkerEarningsProjection()
  const { workers } = useReferenceData()

  const safeWorkers = (workers as any[]) ?? []

  const revenueTrend = useMemo(() => {
    // Group sales by day
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

  const topWorkers = useMemo(() => {
    return earnings.map((e) => {
      const workerInfo = safeWorkers.find((w) => w.id === e.worker_id)
      return {
        name: workerInfo?.full_name || 'Unknown',
        earnings: Number(e.total_earnings),
      }
    }).sort((a, b) => b.earnings - a.earnings)
  }, [earnings, safeWorkers])

  return (
    <>
      <SectionHeader
        eyebrow="Reports"
        title="Branch reports"
        description="Revenue, sales, and worker performance reports derived from projections."
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue report</CardTitle>
            <CardDescription>Derived date-range revenue</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={48} />
                <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fill="var(--primary)" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker performance report</CardTitle>
            <CardDescription>Worker total earnings projection</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWorkers} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={36} />
                <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="earnings" radius={[8, 8, 2, 2]} fill="var(--orange)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

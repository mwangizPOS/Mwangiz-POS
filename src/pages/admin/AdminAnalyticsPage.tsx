import { useState } from 'react'
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
import { branchComparison, revenueTrend, topServices, topWorkers } from '@/pages/mockData'

export function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('month')

  return (
    <>
      <SectionHeader
        eyebrow="Analytics"
        title="Business intelligence"
        description="Revenue, branch, service, and worker performance views."
      />

      <div className="mb-4">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Revenue Trends" description="Global revenue mock trend">
          <AreaChart data={revenueTrend} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={48} />
            <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fill="var(--primary)" fillOpacity={0.18} />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Branch Performance" description="Mock branch comparison">
          <BarChart data={branchComparison} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="branch" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={48} />
            <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Bar dataKey="revenue" radius={[8, 8, 2, 2]} fill="var(--orange)" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Service Performance" description="Mock SaleItem service attribution">
          <BarChart data={topServices} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={36} />
            <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Bar dataKey="count" radius={[8, 8, 2, 2]} fill="var(--primary)" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Worker Performance" description="Mock worker sales count">
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

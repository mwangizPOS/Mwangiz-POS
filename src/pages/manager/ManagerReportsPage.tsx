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
import { revenueTrend, topWorkers } from '@/pages/mockData'

export function ManagerReportsPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Reports"
        title="Branch reports"
        description="Revenue, sales, and worker performance mock reports."
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue report</CardTitle>
            <CardDescription>Mock date-range revenue</CardDescription>
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
            <CardDescription>Mock SaleItem-derived earnings</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWorkers} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={36} />
                <ChartTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="sales" radius={[8, 8, 2, 2]} fill="var(--orange)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

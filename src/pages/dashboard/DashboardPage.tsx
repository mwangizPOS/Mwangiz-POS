import { motion } from 'framer-motion'
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
import { ArrowUpRight, Clock, CreditCard, ReceiptText, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { dashboardMetrics, hourlySales, paymentMix, workerQueue } from './mockData'

const metricIcons = {
  revenue: CreditCard,
  receipts: ReceiptText,
  workers: UsersRound,
  sync: Clock,
} as const

export function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="outline">Dashboard</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">Salon operations</h1>
          <p className="mt-2 text-sm text-secondary-foreground">Today at Nairobi HQ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Online first</Badge>
          <Badge variant="orange">Cashier ready</Badge>
          <Badge variant="pink">Sync shell</Badge>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => {
          const Icon = metricIcons[metric.icon]

          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{metric.value}</CardTitle>
                </div>
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                  <ArrowUpRight className="size-4 text-primary" aria-hidden="true" />
                  <span>{metric.context}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Hourly sales</CardTitle>
            <CardDescription>Mock service revenue by time block</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlySales} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={44} />
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
                  dataKey="sales"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#salesFill)"
                  activeDot={{ r: 5, fill: 'var(--orange)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment mix</CardTitle>
            <CardDescription>Mock tender split</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMix} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="method" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={36} />
                <ChartTooltip
                  cursor={{ fill: 'rgba(245, 197, 66, 0.08)' }}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--popover-foreground)',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 2, 2]} fill="var(--orange)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Worker queue</CardTitle>
          <CardDescription>Mock chair activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Chair</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                {workerQueue.map((row) => (
                  <tr key={`${row.worker}-${row.chair}`} className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">{row.worker}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{row.service}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{row.chair}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === 'Serving' ? 'default' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-secondary-foreground">{row.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

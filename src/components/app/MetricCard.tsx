import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/utils/cn'

type MetricCardProps = {
  label: string
  value: string
  context: string
  icon: LucideIcon
  tone?: 'primary' | 'orange' | 'pink'
}

const toneClasses = {
  primary: 'bg-primary/12 text-primary',
  orange: 'bg-orange/12 text-orange',
  pink: 'bg-pink/12 text-pink',
} as const

export function MetricCard({ label, value, context, icon: Icon, tone = 'primary' }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-2 truncate text-2xl">{value}</CardTitle>
        </div>
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-secondary-foreground">
          <ArrowUpRight className="size-4 text-primary" aria-hidden="true" />
          <span className="truncate">{context}</span>
        </div>
      </CardContent>
    </Card>
  )
}

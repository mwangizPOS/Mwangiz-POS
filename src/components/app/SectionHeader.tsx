import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

type SectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
}

export function SectionHeader({ eyebrow, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <Badge variant="outline">{eyebrow}</Badge>
        <h1 className="mt-3 truncate text-3xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-secondary-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

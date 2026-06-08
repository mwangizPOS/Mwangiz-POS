import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-8 text-center shadow-card', className)}>
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-surface-alt text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary-foreground">
        {description}
      </p>
      {actionLabel ? (
        <Button type="button" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

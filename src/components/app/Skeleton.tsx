import { cn } from '@/utils/cn'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-surface-alt', className)} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-card">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-36" />
      <Skeleton className="mt-5 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  )
}

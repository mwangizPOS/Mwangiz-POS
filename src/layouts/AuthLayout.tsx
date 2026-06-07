import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { productIdentity, shellStatusItems } from '@/app/navigation'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Badge } from '@/components/ui/badge'

type AuthLayoutProps = {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const ProductIcon = productIdentity.icon

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="flex min-h-[420px] flex-col justify-between border-b bg-surface px-6 py-6 lg:min-h-svh lg:border-b-0 lg:border-r lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
                <ProductIcon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{productIdentity.name}</p>
                <p className="truncate text-xs text-secondary-foreground">{productIdentity.descriptor}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            className="max-w-2xl py-12"
          >
            <Badge variant="outline">{productIdentity.role}</Badge>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              MWANGI'Z Salon POS
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-secondary-foreground">
              Dark-first operations shell for cashier flow, branch oversight, and future cloud sync.
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {shellStatusItems.map((item) => (
              <div key={item.label} className="rounded-lg border bg-background/70 px-3 py-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <main className="flex min-h-[560px] items-center justify-center bg-background px-5 py-10">
          {children}
        </main>
      </div>
    </div>
  )
}

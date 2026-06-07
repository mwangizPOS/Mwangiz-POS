import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { LockKeyhole, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/store/uiStore'

export function LoginPage() {
  const setCurrentView = useUiStore((state) => state.setCurrentView)
  const setActiveNavigationItem = useUiStore((state) => state.setActiveNavigationItem)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveNavigationItem('dashboard')
    setCurrentView('dashboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="w-full max-w-[420px]"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>MWANGI'Z Salon POS</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@mwangiz.local"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-2 w-full">
              Open dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

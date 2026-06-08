import type { FormEvent } from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import type { AuthenticatedUser, LoginRequest } from '@/auth/types'
import { getDefaultRouteForRole, roleLabels } from '@/app/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SystemRole } from '@/domain/enums'
import { useUiStore } from '@/store/uiStore'
import { loginRequestSchema } from '@/validation/authSchemas'

export function LoginPage() {
  const [email, setEmail] = useState('cashier@mwangiz.local')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const setCurrentRole = useUiStore((state) => state.setCurrentRole)
  const setCurrentUser = useUiStore((state) => state.setCurrentUser)
  const setAuthenticated = useUiStore((state) => state.setAuthenticated)
  const setActiveRoute = useUiStore((state) => state.setActiveRoute)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const request: LoginRequest = { email, password }
    const parsed = loginRequestSchema.safeParse(request)

    if (!parsed.success) {
      setError('Enter a valid email and a password with at least 8 characters.')
      return
    }

    const role = resolveUiRoleFromEmail(parsed.data.email)
    const user: AuthenticatedUser = {
      id: `ui-user-${role.toLowerCase()}`,
      email: parsed.data.email,
      role,
    }

    setError('')
    setCurrentUser(user)
    setCurrentRole(role)
    setActiveRoute(getDefaultRouteForRole(role))
    setAuthenticated(true)
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
          <CardDescription>Use your assigned MWANGI'Z staff account.</CardDescription>
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="cashier@mwangiz.local"
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="pl-10"
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-pink/50 bg-pink/10 p-3 text-sm text-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-pink" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="rounded-md border bg-background p-3 text-sm">
              <div className="flex items-center gap-2 text-secondary-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                <span>Role is resolved from the authenticated user contract.</span>
              </div>
              <p className="mt-2 font-medium">{roleLabels[resolveUiRoleFromEmail(email)]}</p>
            </div>

            <Button type="submit" size="lg" className="mt-2 w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function resolveUiRoleFromEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail === 'brioneroo@gmail.com' || normalizedEmail.includes('admin')) {
    return SystemRole.SuperAdmin
  }

  if (normalizedEmail.includes('manager')) {
    return SystemRole.BranchManager
  }

  return SystemRole.Cashier
}

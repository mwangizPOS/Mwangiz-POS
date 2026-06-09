import type { FormEvent } from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, LockKeyhole, Mail, Loader2 } from 'lucide-react'
import type { LoginRequest } from '@/auth/types'
import { getDefaultRouteForRole } from '@/app/navigation'
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
import { loginRequestSchema } from '@/validation/authSchemas'
import { authService } from '@/services/frontend/authService'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setActiveRoute = useUiStore((state) => state.setActiveRoute)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const request: LoginRequest = { email, password }
    const parsed = loginRequestSchema.safeParse(request)

    if (!parsed.success) {
      setError('Enter a valid email and a password with at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const user = await authService.login(parsed.data)
      setActiveRoute(getDefaultRouteForRole(user.role))
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid credentials.')
      } else {
        setError('An error occurred during login. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
                  placeholder="name@example.com"
                  className="pl-10"
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-pink/50 bg-pink/10 p-3 text-sm text-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-pink" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}


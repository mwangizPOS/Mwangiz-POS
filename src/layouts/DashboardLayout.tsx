import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { getNavigationForRole, getRouteMeta, roleLabels } from '@/app/navigation'
import { NotificationCenter } from '@/components/app/NotificationCenter'
import { AppSidebar } from '@/components/navigation/AppSidebar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/store/uiStore'

type DashboardLayoutProps = {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const activeRoute = useUiStore((state) => state.activeRoute)
  const currentRole = useUiStore((state) => state.currentRole)
  const setActiveRoute = useUiStore((state) => state.setActiveRoute)
  const resetSession = useUiStore((state) => state.resetSession)
  const routeMeta = getRouteMeta(activeRoute)
  const mobileNavigation = getNavigationForRole(currentRole)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/92 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex min-h-12 items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 lg:hidden">
                  <Badge>MWANGI'Z</Badge>
                  <span className="truncate text-sm font-semibold">{routeMeta.label}</span>
                </div>
                <div className="hidden max-w-md items-center gap-2 rounded-md border bg-surface px-3 lg:flex">
                  <Search className="size-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    aria-label="Search"
                    className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    placeholder="Search"
                  />
                </div>
              </div>

              <Badge variant="outline" className="hidden sm:inline-flex">
                {roleLabels[currentRole]}
              </Badge>
              <ThemeToggle />
              <NotificationCenter />
              <Button type="button" variant="ghost" onClick={resetSession}>
                Sign out
              </Button>
            </div>

            <nav aria-label="Mobile navigation" className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
              {mobileNavigation.map((item) => {
                const Icon = item.icon
                const isActive = item.id === activeRoute

                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-max"
                    onClick={() => setActiveRoute(item.id)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </header>

          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

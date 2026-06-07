import type { ReactNode } from 'react'
import { Bell, Search } from 'lucide-react'
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
  const setCurrentView = useUiStore((state) => state.setCurrentView)

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
                  <span className="text-sm font-semibold">Salon POS</span>
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
                Nairobi HQ
              </Badge>
              <ThemeToggle />
              <Button type="button" variant="outline" size="icon" aria-label="Notifications">
                <Bell className="size-4" aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCurrentView('login')}>
                Sign out
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

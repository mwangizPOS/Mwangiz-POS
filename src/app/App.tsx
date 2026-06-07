import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { useUiStore } from '@/store/uiStore'
import { ThemeProvider } from './providers/ThemeProvider'

export function App() {
  const currentView = useUiStore((state) => state.currentView)

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={120}>
        {currentView === 'login' ? (
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        ) : (
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        )}
      </TooltipProvider>
    </ThemeProvider>
  )
}

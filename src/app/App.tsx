import { ErrorBoundary } from '@/components/app/ErrorBoundary'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoginPage } from '@/pages/login/LoginPage'
import { useUiStore } from '@/store/uiStore'
import { AppRouter } from './AppRouter'
import { ThemeProvider } from './providers/ThemeProvider'

export function App() {
  const isAuthenticated = useUiStore((state) => state.isAuthenticated)

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={120}>
        <ErrorBoundary>
          {isAuthenticated ? (
            <DashboardLayout>
              <AppRouter />
            </DashboardLayout>
          ) : (
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          )}
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  )
}

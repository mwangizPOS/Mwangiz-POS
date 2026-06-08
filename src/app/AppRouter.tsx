import { canRoleAccessRoute, getRouteMeta } from '@/app/navigation'
import { PermissionGuard } from '@/components/app/PermissionGuard'
import { PageTransition } from '@/components/app/PageTransition'
import { useUiStore } from '@/store/uiStore'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import { AdminServicesPage } from '@/pages/admin/AdminServicesPage'
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage'
import { BranchesPage } from '@/pages/admin/BranchesPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { CheckoutPage } from '@/pages/cashier/CheckoutPage'
import { DraftsPage } from '@/pages/cashier/DraftsPage'
import { NewSalePage } from '@/pages/cashier/NewSalePage'
import { PayWorkersPage } from '@/pages/cashier/PayWorkersPage'
import { PaymentLogsPage } from '@/pages/cashier/PaymentLogsPage'
import { RefundsPage } from '@/pages/cashier/RefundsPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ManagerRefundApprovalPage } from '@/pages/manager/ManagerRefundApprovalPage'
import { ManagerReportsPage } from '@/pages/manager/ManagerReportsPage'
import { ManagerSalesPage } from '@/pages/manager/ManagerSalesPage'
import { ManagerServicesPage } from '@/pages/manager/ManagerServicesPage'
import { ManagerWorkersPage } from '@/pages/manager/ManagerWorkersPage'

export function AppRouter() {
  const activeRoute = useUiStore((state) => state.activeRoute)
  const currentRole = useUiStore((state) => state.currentRole)
  const routeMeta = getRouteMeta(activeRoute)
  const allowedRoles = routeMeta.roles

  return (
    <PermissionGuard role={currentRole} allowedRoles={allowedRoles}>
      <PageTransition key={`${currentRole}-${activeRoute}`}>
        {canRoleAccessRoute(currentRole, activeRoute) ? renderRoute(activeRoute) : <DashboardPage />}
      </PageTransition>
    </PermissionGuard>
  )
}

function renderRoute(routeId: string) {
  switch (routeId) {
    case 'dashboard':
      return <DashboardPage />
    case 'new-sale':
      return <NewSalePage />
    case 'drafts':
      return <DraftsPage />
    case 'checkout':
      return <CheckoutPage />
    case 'refunds':
      return <RefundsPage />
    case 'pay-workers':
      return <PayWorkersPage />
    case 'payment-logs':
      return <PaymentLogsPage />
    case 'sales':
      return <ManagerSalesPage />
    case 'services':
      return <ServicesRoute />
    case 'workers':
      return <ManagerWorkersPage />
    case 'refund-approval':
      return <ManagerRefundApprovalPage />
    case 'reports':
      return <ManagerReportsPage />
    case 'branches':
      return <BranchesPage />
    case 'analytics':
      return <AdminAnalyticsPage />
    case 'audit-logs':
      return <AuditLogsPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}

function ServicesRoute() {
  const currentRole = useUiStore((state) => state.currentRole)

  return currentRole === 'SuperAdmin' ? <AdminServicesPage /> : <ManagerServicesPage />
}

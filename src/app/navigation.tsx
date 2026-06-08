import type { LucideIcon } from 'lucide-react'
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FileText,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SquareStack,
  UsersRound,
} from 'lucide-react'
import { SystemRole } from '@/domain/enums'

export type AppRouteId =
  | 'dashboard'
  | 'new-sale'
  | 'drafts'
  | 'checkout'
  | 'refunds'
  | 'pay-workers'
  | 'payment-logs'
  | 'sales'
  | 'branches'
  | 'services'
  | 'workers'
  | 'refund-approval'
  | 'reports'
  | 'analytics'
  | 'audit-logs'
  | 'settings'

export type NavigationItemId = AppRouteId

export type NavigationItem = {
  id: AppRouteId
  label: string
  icon: LucideIcon
  roles: SystemRole[]
  section: 'Operate' | 'Manage' | 'Admin'
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [SystemRole.SuperAdmin, SystemRole.BranchManager, SystemRole.Cashier],
    section: 'Operate',
  },
  {
    id: 'new-sale',
    label: 'New Sale',
    icon: ShoppingCart,
    roles: [SystemRole.Cashier],
    section: 'Operate',
  },
  {
    id: 'refunds',
    label: 'Refunds',
    icon: RotateCcw,
    roles: [SystemRole.Cashier],
    section: 'Operate',
  },
  {
    id: 'pay-workers',
    label: 'Pay Workers',
    icon: BadgeDollarSign,
    roles: [SystemRole.Cashier],
    section: 'Operate',
  },
  {
    id: 'payment-logs',
    label: 'Payment Logs',
    icon: CreditCard,
    roles: [SystemRole.Cashier],
    section: 'Operate',
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: SquareStack,
    roles: [SystemRole.BranchManager],
    section: 'Manage',
  },
  {
    id: 'services',
    label: 'Services',
    icon: Scissors,
    roles: [SystemRole.SuperAdmin, SystemRole.BranchManager],
    section: 'Manage',
  },
  {
    id: 'workers',
    label: 'Workers',
    icon: UsersRound,
    roles: [SystemRole.BranchManager],
    section: 'Manage',
  },
  {
    id: 'refund-approval',
    label: 'Refund Approval',
    icon: ListChecks,
    roles: [SystemRole.BranchManager],
    section: 'Manage',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart,
    roles: [SystemRole.BranchManager],
    section: 'Manage',
  },
  {
    id: 'branches',
    label: 'Branches',
    icon: Building2,
    roles: [SystemRole.SuperAdmin],
    section: 'Admin',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: [SystemRole.SuperAdmin],
    section: 'Admin',
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: ClipboardList,
    roles: [SystemRole.SuperAdmin],
    section: 'Admin',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: [SystemRole.SuperAdmin],
    section: 'Admin',
  },
]

const routeMetaItems: NavigationItem[] = [
  ...navigationItems,
  {
    id: 'drafts',
    label: 'Drafts',
    icon: FileText,
    roles: [SystemRole.Cashier],
    section: 'Operate',
  },
  {
    id: 'checkout',
    label: 'Checkout',
    icon: CreditCard,
    roles: [SystemRole.Cashier],
    section: 'Operate',
  },
]

export const shellStatusItems = [
  { label: 'Cloud source', value: 'Supabase' },
  { label: 'Conflict rule', value: 'Server wins' },
  { label: 'Offline store', value: 'SQLite' },
  { label: 'Security layer', value: 'Audit ready' },
] as const

export const productIdentity = {
  name: "MWANGI'Z",
  descriptor: 'Salon POS',
  role: 'Front desk workspace',
  icon: ShieldCheck,
} as const

export const roleLabels: Record<SystemRole, string> = {
  [SystemRole.SuperAdmin]: 'Super Admin',
  [SystemRole.BranchManager]: 'Branch Manager',
  [SystemRole.Cashier]: 'Cashier',
}

export function getNavigationForRole(role: SystemRole) {
  return navigationItems.filter((item) => item.roles.includes(role))
}

export function getRouteMeta(routeId: AppRouteId) {
  return routeMetaItems.find((item) => item.id === routeId) ?? navigationItems[0]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getDefaultRouteForRole(_role?: SystemRole): AppRouteId {
  return 'dashboard'
}

export function canRoleAccessRoute(role: SystemRole, routeId: AppRouteId) {
  return routeMetaItems.some((item) => item.id === routeId && item.roles.includes(role))
}

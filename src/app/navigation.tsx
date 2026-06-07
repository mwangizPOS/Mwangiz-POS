import type { LucideIcon } from 'lucide-react'
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  RefreshCcw,
  RotateCcw,
  Scissors,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'

export type NavigationItemId =
  | 'dashboard'
  | 'branches'
  | 'services'
  | 'workers'
  | 'payments'
  | 'refunds'
  | 'settlements'
  | 'analytics'
  | 'audit'
  | 'sync'

export type NavigationItem = {
  id: NavigationItemId
  label: string
  icon: LucideIcon
  enabled: boolean
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { id: 'branches', label: 'Branches', icon: Building2, enabled: false },
  { id: 'services', label: 'Services', icon: Scissors, enabled: false },
  { id: 'workers', label: 'Workers', icon: UsersRound, enabled: false },
  { id: 'payments', label: 'Payments', icon: CreditCard, enabled: false },
  { id: 'refunds', label: 'Refunds', icon: RotateCcw, enabled: false },
  { id: 'settlements', label: 'Settlements', icon: BadgeDollarSign, enabled: false },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, enabled: false },
  { id: 'audit', label: 'Audit', icon: ClipboardList, enabled: false },
  { id: 'sync', label: 'Sync', icon: RefreshCcw, enabled: false },
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

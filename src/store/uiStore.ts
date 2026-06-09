import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppRouteId } from '@/app/navigation'
import type { AuthenticatedUser } from '@/auth/types'
import { SystemRole } from '@/domain/enums'
import type { CashierSaleDraft } from '@/types/cashier'
import { setApiAuthToken } from '@/api/apiClient'
import { setSupabaseAuthToken } from '@/api/supabaseClient'

export type AppTheme = 'dark' | 'light'
export type DashboardWidgetId =
  | 'totalRevenue'
  | 'totalSales'
  | 'totalBranches'
  | 'totalWorkers'
  | 'revenueTrend'
  | 'branchComparison'

export type NotificationItem = {
  id: string
  title: string
  body: string
  time: string
  tone: 'default' | 'warning' | 'success'
}

export const defaultDashboardWidgets: DashboardWidgetId[] = [
  'totalRevenue',
  'totalSales',
  'totalBranches',
  'totalWorkers',
  'revenueTrend',
  'branchComparison',
]

type UiState = {
  theme: AppTheme
  isAuthenticated: boolean
  currentUser: AuthenticatedUser | null
  currentRole: SystemRole
  accessToken: string | null
  activeRoute: AppRouteId
  activeNavigationItem: AppRouteId
  activeSaleDraft: CashierSaleDraft
  cashierDrafts: CashierSaleDraft[]
  notifications: NotificationItem[]
  dashboardWidgets: DashboardWidgetId[]
  hiddenDashboardWidgets: DashboardWidgetId[]
  setTheme: (theme: AppTheme) => void
  setSession: (user: AuthenticatedUser, role: SystemRole, token: string) => void
  setCurrentRole: (role: SystemRole) => void
  setActiveRoute: (route: AppRouteId) => void
  setActiveNavigationItem: (item: AppRouteId) => void
  setActiveSaleDraft: (draft: CashierSaleDraft) => void
  startNewCashierSale: () => void
  saveActiveSaleDraft: () => void
  loadCashierDraft: (draftId: string) => void
  deleteCashierDraft: (draftId: string) => void
  resetSession: () => void
  dismissNotification: (id: string) => void
  toggleDashboardWidget: (widget: DashboardWidgetId) => void
  moveDashboardWidget: (widget: DashboardWidgetId, direction: 'up' | 'down') => void
}

function createCashierSaleDraft(): CashierSaleDraft {
  const timestamp = new Date().toISOString()
  const serial = Date.now().toString().slice(-5)

  return {
    id: `draft-${serial}`,
    saleNumber: `SALE-${new Date().getFullYear()}-${serial}`,
    clients: [
      {
        id: 'client-1',
        label: 'Client 1',
        items: [],
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function touchDraft(draft: CashierSaleDraft): CashierSaleDraft {
  return {
    ...draft,
    updatedAt: new Date().toISOString(),
  }
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      isAuthenticated: false,
      currentUser: null,
      currentRole: SystemRole.Cashier,
      accessToken: null,
      activeRoute: 'dashboard',
      activeNavigationItem: 'dashboard',
      activeSaleDraft: createCashierSaleDraft(),
      cashierDrafts: [],
      notifications: [],
      dashboardWidgets: defaultDashboardWidgets,
      hiddenDashboardWidgets: [],
      setTheme: (theme) => set({ theme }),
      setSession: (user, role, token) => {
        setApiAuthToken(token)
        setSupabaseAuthToken(token)
        set({
          isAuthenticated: true,
          currentUser: user,
          currentRole: role,
          accessToken: token,
        })
      },
      setCurrentRole: (currentRole) => set({ currentRole }),
      setActiveRoute: (activeRoute) => set({ activeRoute, activeNavigationItem: activeRoute }),
      setActiveNavigationItem: (activeNavigationItem) =>
        set({ activeNavigationItem, activeRoute: activeNavigationItem }),
      setActiveSaleDraft: (activeSaleDraft) => set({ activeSaleDraft: touchDraft(activeSaleDraft) }),
      startNewCashierSale: () => set({ activeSaleDraft: createCashierSaleDraft() }),
      saveActiveSaleDraft: () =>
        set((state) => {
          const draft = touchDraft(state.activeSaleDraft)
          const existingDraft = state.cashierDrafts.some((item) => item.id === draft.id)

          return {
            activeSaleDraft: draft,
            cashierDrafts: existingDraft
              ? state.cashierDrafts.map((item) => (item.id === draft.id ? draft : item))
              : [draft, ...state.cashierDrafts],
          }
        }),
      loadCashierDraft: (draftId) =>
        set((state) => {
          const draft = state.cashierDrafts.find((item) => item.id === draftId)

          return draft ? { activeSaleDraft: touchDraft(draft) } : {}
        }),
      deleteCashierDraft: (draftId) =>
        set((state) => ({
          cashierDrafts: state.cashierDrafts.filter((draft) => draft.id !== draftId),
        })),
      resetSession: () => {
        setApiAuthToken(null)
        setSupabaseAuthToken(null)
        set({
          isAuthenticated: false,
          currentUser: null,
          accessToken: null,
          activeRoute: 'dashboard',
          activeNavigationItem: 'dashboard',
        })
      },
      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        })),
      toggleDashboardWidget: (widget) =>
        set((state) => {
          const isHidden = state.hiddenDashboardWidgets.includes(widget)
          return {
            hiddenDashboardWidgets: isHidden
              ? state.hiddenDashboardWidgets.filter((item) => item !== widget)
              : [...state.hiddenDashboardWidgets, widget],
          }
        }),
      moveDashboardWidget: (widget, direction) =>
        set(() => {
          const widgets = [...get().dashboardWidgets]
          const index = widgets.indexOf(widget)
          const targetIndex = direction === 'up' ? index - 1 : index + 1

          if (index < 0 || targetIndex < 0 || targetIndex >= widgets.length) {
            return {}
          }

          const target = widgets[targetIndex]
          widgets[targetIndex] = widget
          widgets[index] = target

          return { dashboardWidgets: widgets }
        }),
    }),
    {
      name: 'mwangiz-pos-ui',
      partialize: (state) => ({
        theme: state.theme,
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        accessToken: state.accessToken,
        activeRoute: state.activeRoute,
        activeNavigationItem: state.activeNavigationItem,
        activeSaleDraft: state.activeSaleDraft,
        cashierDrafts: state.cashierDrafts,
        dashboardWidgets: state.dashboardWidgets,
        hiddenDashboardWidgets: state.hiddenDashboardWidgets,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setApiAuthToken(state.accessToken)
          setSupabaseAuthToken(state.accessToken)
        }
      },
    },
  ),
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NavigationItemId } from '@/app/navigation'

export type AppTheme = 'dark' | 'light'
export type ShellView = 'login' | 'dashboard'

type UiState = {
  theme: AppTheme
  currentView: ShellView
  activeNavigationItem: NavigationItemId
  setTheme: (theme: AppTheme) => void
  setCurrentView: (view: ShellView) => void
  setActiveNavigationItem: (item: NavigationItemId) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      currentView: 'login',
      activeNavigationItem: 'dashboard',
      setTheme: (theme) => set({ theme }),
      setCurrentView: (currentView) => set({ currentView }),
      setActiveNavigationItem: (activeNavigationItem) => set({ activeNavigationItem }),
    }),
    {
      name: 'mwangiz-pos-ui',
      partialize: (state) => ({
        theme: state.theme,
        activeNavigationItem: state.activeNavigationItem,
      }),
    },
  ),
)

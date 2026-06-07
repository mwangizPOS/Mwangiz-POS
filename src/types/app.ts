import type { NavigationItemId } from '@/app/navigation'
import type { SystemRole } from '@/domain/enums'

export type UserRole = SystemRole

export type AppNavigationState = {
  activeItem: NavigationItemId
}

export type SyncConflictPolicy = 'server-wins'

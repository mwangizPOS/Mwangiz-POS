import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import type { SystemRole } from '@/domain/enums'
import { EmptyState } from './EmptyState'

type PermissionGuardProps = {
  role: SystemRole
  allowedRoles: SystemRole[]
  children: ReactNode
}

export function PermissionGuard({ role, allowedRoles, children }: PermissionGuardProps) {
  if (allowedRoles.includes(role)) {
    return children
  }

  return (
    <EmptyState
      icon={ShieldAlert}
      title="Access unavailable"
      description="This workspace is not available for the selected role."
    />
  )
}

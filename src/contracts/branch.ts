import type { Branch } from '@/domain/entities'
import type { EntityId } from '@/types/primitives'

export interface CreateBranchRequest {
  name: string
  code: string
  address: string
  managerId: EntityId
  active?: boolean
}

export interface UpdateBranchRequest {
  id: EntityId
  name?: string
  code?: string
  address?: string
  managerId?: EntityId
  active?: boolean
}

export interface CreateBranchResponse {
  branch: Branch
}

export interface UpdateBranchResponse {
  branch: Branch
}

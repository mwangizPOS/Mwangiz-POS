import type { Worker } from '@/domain/entities'
import type { EntityId } from '@/types/primitives'

export interface CreateWorkerRequest {
  branchId: EntityId
  fullName: string
  phone: string
  skills: string[]
  active?: boolean
}

export interface UpdateWorkerRequest {
  id: EntityId
  branchId?: EntityId
  fullName?: string
  phone?: string
  skills?: string[]
  active?: boolean
}

export interface CreateWorkerResponse {
  worker: Worker
}

export interface UpdateWorkerResponse {
  worker: Worker
}

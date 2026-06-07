import type { Service } from '@/domain/entities'
import type { EntityId, MoneyAmount, Percentage } from '@/types/primitives'

export interface CreateServiceRequest {
  name: string
  defaultPrice: MoneyAmount
  commissionPercent: Percentage
  active?: boolean
}

export interface UpdateServiceRequest {
  id: EntityId
  name?: string
  defaultPrice?: MoneyAmount
  commissionPercent?: Percentage
  active?: boolean
}

export interface CreateServiceResponse {
  service: Service
}

export interface UpdateServiceResponse {
  service: Service
}

import type { Refund } from '@/domain/entities'
import type { RefundTarget, RefundType } from '@/domain/enums'
import type {
  RefundApprovedEvent,
  RefundRequestedEvent,
} from '@/events'
import type { EntityId, MoneyAmount } from '@/types/primitives'

export interface CreateRefundRequest {
  saleId?: EntityId | null
  saleItemId?: EntityId | null
  refundTarget: RefundTarget
  refundType: RefundType
  amount: MoneyAmount
  reason: string
  branchId: EntityId
  actorId: EntityId
  idempotencyKey: string
}

export interface CreateRefundResponse {
  refundId: EntityId
  refund: Refund
  event: RefundRequestedEvent
}

export interface ApproveRefundRequest {
  refundId: EntityId
  branchId: EntityId
  actorId: EntityId
  idempotencyKey: string
}

export interface ApproveRefundResponse {
  refundId: EntityId
  refund: Refund
  event: RefundApprovedEvent
}

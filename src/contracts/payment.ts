import type { PaymentMethod, PaymentStatus } from '@/domain/enums'
import type {
  PaymentCompletedEvent,
  PaymentInitiatedEvent,
  SplitPaymentRecordedEvent,
} from '@/events'
import type { EntityId, MoneyAmount } from '@/types/primitives'

export interface InitiatePaymentRequest {
  saleId: EntityId
  branchId: EntityId
  actorId: EntityId
  paymentMethod: PaymentMethod
  amount: MoneyAmount
  idempotencyKey: string
}

export interface InitiatePaymentResponse {
  saleId: EntityId
  paymentStatus: PaymentStatus
  event: PaymentInitiatedEvent
}

export interface ConfirmPaymentRequest {
  saleId: EntityId
  branchId: EntityId
  actorId: EntityId
  paymentMethod: PaymentMethod
  amount: MoneyAmount
  paymentReference?: string | null
  idempotencyKey: string
}

export interface ConfirmPaymentResponse {
  saleId: EntityId
  paymentStatus: PaymentStatus
  event: PaymentCompletedEvent
}

export interface SplitPaymentComponentRequest {
  method: PaymentMethod
  amount: MoneyAmount
}

export interface SplitPaymentRequest {
  saleId: EntityId
  branchId: EntityId
  actorId: EntityId
  amount: MoneyAmount
  components: SplitPaymentComponentRequest[]
  idempotencyKey: string
}

export interface SplitPaymentResponse {
  saleId: EntityId
  splitPaymentId: EntityId
  event: SplitPaymentRecordedEvent
}

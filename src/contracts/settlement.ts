import type { WorkerSettlement } from '@/domain/entities'
import type {
  WorkerSettlementCalculatedEvent,
  WorkerSettlementMarkedPaidEvent,
} from '@/events'
import type { DateTimeString, EntityId, MoneyAmount } from '@/types/primitives'

export interface CreateSettlementRequest {
  workerId: EntityId
  amount: MoneyAmount
  periodStart: DateTimeString
  periodEnd: DateTimeString
  paidBy: EntityId
}

export interface CreateSettlementResponse {
  settlement: WorkerSettlement
}

export interface CalculateSettlementRequest {
  workerId: EntityId
  branchId: EntityId
  periodStart: DateTimeString
  periodEnd: DateTimeString
  actorId: EntityId
  idempotencyKey: string
}

export interface CalculateSettlementResponse {
  settlementId: EntityId
  workerId: EntityId
  totalEarned: MoneyAmount
  saleItemIds: EntityId[]
  event: WorkerSettlementCalculatedEvent
}

export interface MarkWorkerPaidRequest {
  settlementId: EntityId
  workerId: EntityId
  branchId: EntityId
  paidBy: EntityId
  idempotencyKey: string
}

export interface MarkWorkerPaidResponse {
  settlementId: EntityId
  workerId: EntityId
  event: WorkerSettlementMarkedPaidEvent
}

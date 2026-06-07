import type { SaleItemStatus, SaleStatus } from '@/domain/enums'
import type { Sale, SaleClient, SaleItem, SplitPayment } from '@/domain/entities'
import type {
  SaleCompletedEvent,
  SaleCreatedEvent,
  SaleItemAddedEvent,
} from '@/events'
import type { EntityId, MoneyAmount, Percentage } from '@/types/primitives'

export interface CreateSaleClientInput {
  clientReference: string
  label: string
  displayName?: string | null
}

export interface CreateSaleItemRequest {
  serviceId: EntityId
  workerId: EntityId
  quantity?: number
  price: MoneyAmount
  commissionRateSnapshot: Percentage
  saleClientReference?: string | null
}

export interface CreateSplitPaymentRequest {
  cashAmount: MoneyAmount
  mpesaAmount: MoneyAmount
  bankAmount: MoneyAmount
}

export interface CreateSaleRequest {
  branchId: EntityId
  createdBy: EntityId
  idempotencyKey: string
  clients?: CreateSaleClientInput[]
}

export interface CreateSaleResponse {
  saleId: EntityId
  saleNumber: string
  branchId: EntityId
  status: SaleStatus
  clients: SaleClient[]
  event: SaleCreatedEvent
}

export interface AddSaleItemRequest {
  saleId: EntityId
  branchId: EntityId
  actorId: EntityId
  idempotencyKey: string
  item: CreateSaleItemRequest
}

export interface AddSaleItemResponse {
  saleId: EntityId
  saleItemId: EntityId
  status: SaleItemStatus
  event: SaleItemAddedEvent
}

export interface CompleteSaleRequest {
  saleId: EntityId
  branchId: EntityId
  actorId: EntityId
  expectedTotalAmount: MoneyAmount
  idempotencyKey: string
}

export interface CompleteSaleResponse {
  saleId: EntityId
  status: SaleStatus
  totalAmount: MoneyAmount
  event: SaleCompletedEvent
}

export type SaleSnapshot = Sale & {
  clients: SaleClient[]
  items: SaleItem[]
  splitPayment?: SplitPayment
}

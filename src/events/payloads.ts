import type {
  AuditAction,
  AuditEntityType,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  RefundTarget,
  RefundType,
  SaleItemStatus,
  SaleStatus,
  SettlementStatus,
} from '@/domain/enums'
import type {
  DateTimeString,
  EntityId,
  JsonObject,
  MoneyAmount,
  Percentage,
} from '@/types/primitives'

export interface SaleClientLabelPayload {
  saleClientId: EntityId
  label: string
}

export interface SaleCreatedPayload {
  saleId: EntityId
  saleNumber: string
  branchId: EntityId
  status: SaleStatus
  clients: SaleClientLabelPayload[]
}

export interface SaleCompletedPayload {
  saleId: EntityId
  totalAmount: MoneyAmount
  status: SaleStatus
  completedAt: DateTimeString
}

export interface SaleCancelledPayload {
  saleId: EntityId
  status: SaleStatus
  reason: string
}

export interface SaleItemAddedPayload {
  saleId: EntityId
  saleItemId: EntityId
  saleClientId?: EntityId | null
  serviceId: EntityId
  workerId: EntityId
  quantity: number
  price: MoneyAmount
  commissionRateSnapshot: Percentage
  status: SaleItemStatus
}

export interface SaleItemUpdatedPayload {
  saleId: EntityId
  saleItemId: EntityId
  saleClientId?: EntityId | null
  serviceId?: EntityId
  workerId?: EntityId
  quantity?: number
  price?: MoneyAmount
  commissionRateSnapshot?: Percentage
  status?: SaleItemStatus
}

export interface SaleItemRemovedPayload {
  saleId: EntityId
  saleItemId: EntityId
  status: SaleItemStatus
  reason: string
}

export interface PaymentInitiatedPayload {
  saleId: EntityId
  paymentMethod: PaymentMethod
  amount: MoneyAmount
  paymentStatus: PaymentStatus
  providerRequestId?: string | null
  merchantRequestId?: string | null
}

export interface PaymentCompletedPayload {
  saleId: EntityId
  paymentMethod: PaymentMethod
  amount: MoneyAmount
  paymentStatus: PaymentStatus
  paymentReference?: string | null
  providerRequestId?: string | null
  merchantRequestId?: string | null
  completedAt: DateTimeString
}

export interface SplitPaymentComponentPayload {
  method: PaymentMethod
  amount: MoneyAmount
}

export interface SplitPaymentRecordedPayload {
  saleId: EntityId
  splitPaymentId: EntityId
  amount: MoneyAmount
  components: SplitPaymentComponentPayload[]
}

export interface RefundRequestedPayload {
  refundId: EntityId
  saleId?: EntityId | null
  saleItemId?: EntityId | null
  refundTarget: RefundTarget
  refundType: RefundType
  amount: MoneyAmount
  reason: string
  status: RefundStatus
}

export interface RefundApprovedPayload {
  refundId: EntityId
  approvedBy: EntityId
  approvedAt: DateTimeString
  status: RefundStatus
}

export interface RefundRejectedPayload {
  refundId: EntityId
  rejectedBy: EntityId
  rejectedAt: DateTimeString
  rejectionReason: string
  status: RefundStatus
}

export interface RefundProcessedPayload {
  refundId: EntityId
  processedAmount: MoneyAmount
  processedAt: DateTimeString
  status: RefundStatus
}

export interface WorkerSettlementCalculatedPayload {
  settlementId: EntityId
  workerId: EntityId
  periodStart: DateTimeString
  periodEnd: DateTimeString
  totalEarned: MoneyAmount
  saleItemIds: EntityId[]
  status: SettlementStatus
}

export interface WorkerPaidPayload {
  workerId: EntityId
  settlementId: EntityId
  amount: MoneyAmount
  paidBy: EntityId
  paidAt: DateTimeString
}

export interface WorkerSettlementMarkedPaidPayload {
  settlementId: EntityId
  workerId: EntityId
  status: SettlementStatus
  paidBy: EntityId
  paidAt: DateTimeString
}

export interface AuditLogCreatedPayload {
  auditLogId: EntityId
  action: AuditAction
  entityType: AuditEntityType
  entityId: EntityId
  performedBy: EntityId
  branchId: EntityId
  metadata: JsonObject
}

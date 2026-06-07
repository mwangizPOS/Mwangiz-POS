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
  SyncStatus,
} from '@/domain/enums'
import type { EventType } from '@/events'
import type {
  DateTimeString,
  EntityId,
  JsonObject,
  MoneyAmount,
  Percentage,
} from '@/types/primitives'

export interface SaleProjection {
  id: EntityId
  saleNumber: string
  branchId: EntityId
  status: SaleStatus
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  subtotal: MoneyAmount
  refundAmount: MoneyAmount
  totalAmount: MoneyAmount
  syncStatus: SyncStatus
  createdBy: EntityId
  createdAt: DateTimeString
  updatedAt: DateTimeString
  completedAt?: DateTimeString
  cancelledAt?: DateTimeString
}

export interface SaleClientProjection {
  id: EntityId
  saleId: EntityId
  label: string
  createdAt: DateTimeString
}

export interface SaleItemProjection {
  id: EntityId
  saleId: EntityId
  saleClientId: EntityId | null
  serviceId: EntityId
  workerId: EntityId
  quantity: number
  price: MoneyAmount
  commissionRateSnapshot: Percentage
  workerRevenue: MoneyAmount
  salonRevenue: MoneyAmount
  refundedAmount: MoneyAmount
  status: SaleItemStatus
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface SplitPaymentComponentProjection {
  method: PaymentMethod
  amount: MoneyAmount
}

export interface SplitPaymentProjection {
  id: EntityId
  saleId: EntityId
  amount: MoneyAmount
  components: SplitPaymentComponentProjection[]
  createdAt: DateTimeString
}

export interface RefundProjection {
  id: EntityId
  saleId: EntityId | null
  saleItemId: EntityId | null
  refundTarget: RefundTarget
  refundType: RefundType
  refundAmount: MoneyAmount
  processedAmount: MoneyAmount
  reason: string
  status: RefundStatus
  requestedBy: EntityId
  approvedBy: EntityId | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface WorkerSettlementProjection {
  id: EntityId
  workerId: EntityId
  branchId: EntityId
  periodStart: DateTimeString
  periodEnd: DateTimeString
  totalEarned: MoneyAmount
  saleItemIds: EntityId[]
  status: SettlementStatus
  paidBy: EntityId | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface AuditLogProjection {
  id: EntityId
  action: AuditAction
  entityType: AuditEntityType
  entityId: EntityId
  performedBy: EntityId
  branchId: EntityId
  metadata: JsonObject
  timestamp: DateTimeString
}

export interface ProjectionUpdateSummary {
  sales: EntityId[]
  saleItems: EntityId[]
  refunds: EntityId[]
  settlements: EntityId[]
  auditLogs: EntityId[]
}

export interface SettlementRecalculationTrigger {
  workerId: EntityId
  branchId: EntityId
  reason:
    | typeof EventType.SaleItemAdded
    | typeof EventType.SaleItemUpdated
    | typeof EventType.SaleItemRemoved
    | typeof EventType.RefundProcessed
}

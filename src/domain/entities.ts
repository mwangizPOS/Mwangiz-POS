import type {
  AuditAction,
  AuditEntityType,
  OfflineActionType,
  PaymentMethod,
  PaymentStatus,
  RefundTarget,
  RefundStatus,
  RefundType,
  SettlementStatus,
  SyncStatus,
} from './enums'
import type {
  DateTimeString,
  EntityId,
  JsonObject,
  MoneyAmount,
  Percentage,
} from '@/types/primitives'

export interface Branch {
  id: EntityId
  name: string
  code: string
  address: string
  managerId: EntityId
  active: boolean
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface Service {
  id: EntityId
  name: string
  defaultPrice: MoneyAmount
  commissionPercent: Percentage
  active: boolean
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface Worker {
  id: EntityId
  branchId: EntityId
  fullName: string
  phone: string
  skills: string[]
  active: boolean
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface Sale {
  id: EntityId
  saleNumber: string
  branchId: EntityId
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotal: MoneyAmount
  refundAmount: MoneyAmount
  totalAmount: MoneyAmount
  syncStatus: SyncStatus
  createdBy: EntityId
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface SaleClient {
  id: EntityId
  saleId: EntityId
  label: string
  displayName: string | null
  createdAt: DateTimeString
}

export interface SaleItem {
  id: EntityId
  saleId: EntityId
  saleClientId: EntityId | null
  serviceId: EntityId
  workerId: EntityId
  unitPrice: MoneyAmount
  commissionPercent: Percentage
  workerRevenue: MoneyAmount
  salonRevenue: MoneyAmount
  refundedAmount: MoneyAmount
  createdAt: DateTimeString
}

export interface SplitPayment {
  id: EntityId
  saleId: EntityId
  cashAmount: MoneyAmount
  mpesaAmount: MoneyAmount
  bankAmount: MoneyAmount
}

export interface Refund {
  id: EntityId
  saleId: EntityId | null
  saleItemId: EntityId | null
  refundTarget: RefundTarget
  refundType: RefundType
  refundAmount: MoneyAmount
  reason: string
  status: RefundStatus
  requestedBy: EntityId
  approvedBy: EntityId | null
  createdAt: DateTimeString
}

export interface WorkerSettlement {
  id: EntityId
  workerId: EntityId
  amount: MoneyAmount
  periodStart: DateTimeString
  periodEnd: DateTimeString
  paidBy: EntityId
  status: SettlementStatus
  createdAt: DateTimeString
}

export interface AuditLog {
  id: EntityId
  action: AuditAction
  entityType: AuditEntityType
  entityId: EntityId
  performedBy: EntityId
  branchId: EntityId
  timestamp: DateTimeString
  metadata: JsonObject
}

export interface OfflineQueueItem {
  id: EntityId
  actionType: OfflineActionType
  payload: JsonObject
  syncStatus: SyncStatus
  retryCount: number
  createdAt: DateTimeString
}

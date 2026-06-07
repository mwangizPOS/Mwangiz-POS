import type {
  AuditAction,
  AuditEntityType,
  OfflineActionType,
  PaymentMethod,
  PaymentStatus,
  RefundTarget,
  RefundStatus,
  RefundType,
  SaleItemStatus,
  SaleStatus,
  SettlementStatus,
  SyncStatus,
  SystemRole,
} from '@/domain/enums'
import type { EventAggregateType, EventType } from '@/events'
import type {
  DateTimeString,
  EntityId,
  JsonObject,
  MoneyAmount,
  Percentage,
} from './primitives'

export type DatabaseTableName =
  | 'users'
  | 'branches'
  | 'services'
  | 'workers'
  | 'sales'
  | 'sale_clients'
  | 'sale_items'
  | 'split_payments'
  | 'refunds'
  | 'worker_settlements'
  | 'audit_logs'
  | 'event_store'
  | 'idempotency_keys'
  | 'offline_queue'

export type ProcessingStatus = 'Pending' | 'Processed' | 'Rejected'

export interface DbUserRow {
  id: EntityId
  email: string
  password_hash: string
  role: SystemRole
  active: boolean
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DbBranchRow {
  id: EntityId
  name: string
  code: string
  address: string
  manager_id: EntityId
  active: boolean
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DbServiceRow {
  id: EntityId
  name: string
  default_price: MoneyAmount
  commission_percent: Percentage
  active: boolean
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DbWorkerRow {
  id: EntityId
  branch_id: EntityId
  full_name: string
  phone: string
  skills: string[]
  active: boolean
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DbSaleRow {
  id: EntityId
  sale_number: string
  branch_id: EntityId
  status: SaleStatus
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  subtotal: MoneyAmount
  refund_amount: MoneyAmount
  total_amount: MoneyAmount
  sync_status: SyncStatus
  created_by: EntityId
  created_at: DateTimeString
  updated_at: DateTimeString
  completed_at: DateTimeString | null
  cancelled_at: DateTimeString | null
}

export interface DbSaleClientRow {
  id: EntityId
  sale_id: EntityId
  label: string
  created_at: DateTimeString
}

export interface DbSaleItemRow {
  id: EntityId
  sale_id: EntityId
  sale_client_id: EntityId | null
  service_id: EntityId
  worker_id: EntityId
  quantity: number
  price: MoneyAmount
  commission_rate_snapshot: Percentage
  worker_revenue: MoneyAmount
  salon_revenue: MoneyAmount
  refunded_amount: MoneyAmount
  status: SaleItemStatus
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DbSplitPaymentRow {
  id: EntityId
  sale_id: EntityId
  method: PaymentMethod
  cash_amount: MoneyAmount
  mpesa_amount: MoneyAmount
  bank_amount: MoneyAmount
  created_at: DateTimeString
}

export interface DbRefundRow {
  id: EntityId
  sale_id: EntityId | null
  sale_item_id: EntityId | null
  refund_target: RefundTarget
  refund_type: RefundType
  refund_amount: MoneyAmount
  processed_amount: MoneyAmount
  reason: string
  status: RefundStatus
  requested_by: EntityId
  approved_by: EntityId | null
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DbWorkerSettlementRow {
  id: EntityId
  worker_id: EntityId
  branch_id: EntityId
  period_start: DateTimeString
  period_end: DateTimeString
  total_earned: MoneyAmount
  paid_amount: MoneyAmount
  unpaid_amount: MoneyAmount
  paid_by: EntityId | null
  paid_at: DateTimeString | null
  status: SettlementStatus
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DbAuditLogRow {
  id: EntityId
  action: AuditAction
  entity_type: AuditEntityType
  entity_id: EntityId
  performed_by: EntityId
  branch_id: EntityId
  metadata: JsonObject
  timestamp: DateTimeString
}

export interface DbEventStoreRow {
  event_id: EntityId
  event_type: EventType
  aggregate_id: EntityId
  aggregate_type: EventAggregateType
  branch_id: EntityId
  actor_id: EntityId
  payload: JsonObject
  version: number
  idempotency_key: string
  occurred_at: DateTimeString
  recorded_at: DateTimeString
}

export interface DbIdempotencyKeyRow {
  idempotency_key: string
  event_id: EntityId
  status: ProcessingStatus
  first_seen_at: DateTimeString
  processed_at: DateTimeString | null
}

export interface DbOfflineQueueRow {
  id: EntityId
  device_id: string | null
  event_id: EntityId | null
  action_type: OfflineActionType
  payload: JsonObject
  sync_status: SyncStatus
  retry_count: number
  next_retry_at: DateTimeString | null
  last_error: string | null
  created_at: DateTimeString
  updated_at: DateTimeString
}

export interface DatabaseRows {
  users: DbUserRow
  branches: DbBranchRow
  services: DbServiceRow
  workers: DbWorkerRow
  sales: DbSaleRow
  sale_clients: DbSaleClientRow
  sale_items: DbSaleItemRow
  split_payments: DbSplitPaymentRow
  refunds: DbRefundRow
  worker_settlements: DbWorkerSettlementRow
  audit_logs: DbAuditLogRow
  event_store: DbEventStoreRow
  idempotency_keys: DbIdempotencyKeyRow
  offline_queue: DbOfflineQueueRow
}

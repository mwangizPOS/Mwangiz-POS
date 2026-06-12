import { EventTypeRegistry } from './registry.js'

export const LegacyEventTypeNameRegistry = {
  SaleCreated: 'SaleCreated',
  SaleCompleted: 'SaleCompleted',
  SaleCancelled: 'SaleCancelled',
  SaleItemAdded: 'SaleItemAdded',
  SaleItemUpdated: 'SaleItemUpdated',
  SaleItemRemoved: 'SaleItemRemoved',
  PaymentInitiated: 'PaymentInitiated',
  PaymentCompleted: 'PaymentCompleted',
  SplitPaymentRecorded: 'SplitPaymentRecorded',
  RefundRequested: 'RefundRequested',
  RefundApproved: 'RefundApproved',
  RefundRejected: 'RefundRejected',
  RefundProcessed: 'RefundProcessed',
  WorkerSettlementCalculated: 'WorkerSettlementCalculated',
  WorkerPaid: 'WorkerPaid',
  WorkerSettlementMarkedPaid: 'WorkerSettlementMarkedPaid',
  AuditLogCreated: 'AuditLogCreated',
} as const

export type LegacyEventTypeName =
  (typeof LegacyEventTypeNameRegistry)[keyof typeof LegacyEventTypeNameRegistry]

export const LegacyToCanonicalEventTypeMapping = {
  [LegacyEventTypeNameRegistry.SaleCreated]: EventTypeRegistry.SALE_CREATED,
  [LegacyEventTypeNameRegistry.SaleCompleted]: EventTypeRegistry.SALE_COMPLETED,
  [LegacyEventTypeNameRegistry.SaleCancelled]: EventTypeRegistry.SALE_CANCELLED,
  [LegacyEventTypeNameRegistry.SaleItemAdded]: EventTypeRegistry.SALE_ITEM_CREATED,
  [LegacyEventTypeNameRegistry.SaleItemUpdated]: EventTypeRegistry.SALE_ITEM_UPDATED,
  [LegacyEventTypeNameRegistry.SaleItemRemoved]: EventTypeRegistry.SALE_ITEM_REMOVED,
  [LegacyEventTypeNameRegistry.PaymentInitiated]: EventTypeRegistry.PAYMENT_INITIATED,
  [LegacyEventTypeNameRegistry.PaymentCompleted]: EventTypeRegistry.PAYMENT_PROCESSED,
  [LegacyEventTypeNameRegistry.SplitPaymentRecorded]: EventTypeRegistry.SPLIT_PAYMENT_RECORDED,
  [LegacyEventTypeNameRegistry.RefundRequested]: EventTypeRegistry.REFUND_REQUESTED,
  [LegacyEventTypeNameRegistry.RefundApproved]: EventTypeRegistry.REFUND_APPROVED,
  [LegacyEventTypeNameRegistry.RefundRejected]: EventTypeRegistry.REFUND_REJECTED,
  [LegacyEventTypeNameRegistry.RefundProcessed]: EventTypeRegistry.REFUND_APPLIED,
  [LegacyEventTypeNameRegistry.WorkerSettlementCalculated]:
    EventTypeRegistry.WORKER_SETTLEMENT_CALCULATED,
  [LegacyEventTypeNameRegistry.WorkerPaid]: EventTypeRegistry.WORKER_SETTLEMENT_PAID,
  [LegacyEventTypeNameRegistry.WorkerSettlementMarkedPaid]:
    EventTypeRegistry.WORKER_SETTLEMENT_PAID,
  [LegacyEventTypeNameRegistry.AuditLogCreated]: EventTypeRegistry.AUDIT_LOG_CREATED,
} as const

export const AlternateToCanonicalEventTypeMapping = {
  SaleItemCreated: EventTypeRegistry.SALE_ITEM_CREATED,
  PaymentProcessed: EventTypeRegistry.PAYMENT_PROCESSED,
  RefundApplied: EventTypeRegistry.REFUND_APPLIED,
  SettlementUpdated: EventTypeRegistry.WORKER_SETTLEMENT_CALCULATED,
  WorkerSettlementUpdated: EventTypeRegistry.WORKER_SETTLEMENT_CALCULATED,
  WorkerSettlementPaid: EventTypeRegistry.WORKER_SETTLEMENT_PAID,
  AuditLogged: EventTypeRegistry.AUDIT_LOG_CREATED,
} as const

export type CanonicalEventMapping =
  | typeof LegacyToCanonicalEventTypeMapping
  | typeof AlternateToCanonicalEventTypeMapping

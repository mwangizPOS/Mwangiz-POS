import { defineUniqueRegistryValues } from './validateRegistry'

export const EventTypeRegistry = {
  SALE_CREATED: 'SALE_CREATED',
  SALE_COMPLETED: 'SALE_COMPLETED',
  SALE_CANCELLED: 'SALE_CANCELLED',
  SALE_ITEM_CREATED: 'SALE_ITEM_CREATED',
  SALE_ITEM_UPDATED: 'SALE_ITEM_UPDATED',
  SALE_ITEM_REMOVED: 'SALE_ITEM_REMOVED',
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  SPLIT_PAYMENT_RECORDED: 'SPLIT_PAYMENT_RECORDED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUND_APPROVED: 'REFUND_APPROVED',
  REFUND_REJECTED: 'REFUND_REJECTED',
  REFUND_APPLIED: 'REFUND_APPLIED',
  REFUND_REVERSED: 'REFUND_REVERSED',
  WORKER_SETTLEMENT_CALCULATED: 'WORKER_SETTLEMENT_CALCULATED',
  WORKER_SETTLEMENT_PAID: 'WORKER_SETTLEMENT_PAID',
  AUDIT_LOG_CREATED: 'AUDIT_LOG_CREATED',
} as const

export type CanonicalEventType =
  (typeof EventTypeRegistry)[keyof typeof EventTypeRegistry]

export const EventTypeRegistryValues = defineUniqueRegistryValues([
  EventTypeRegistry.SALE_CREATED,
  EventTypeRegistry.SALE_COMPLETED,
  EventTypeRegistry.SALE_CANCELLED,
  EventTypeRegistry.SALE_ITEM_CREATED,
  EventTypeRegistry.SALE_ITEM_UPDATED,
  EventTypeRegistry.SALE_ITEM_REMOVED,
  EventTypeRegistry.PAYMENT_INITIATED,
  EventTypeRegistry.PAYMENT_PROCESSED,
  EventTypeRegistry.SPLIT_PAYMENT_RECORDED,
  EventTypeRegistry.REFUND_REQUESTED,
  EventTypeRegistry.REFUND_APPROVED,
  EventTypeRegistry.REFUND_REJECTED,
  EventTypeRegistry.REFUND_APPLIED,
  EventTypeRegistry.REFUND_REVERSED,
  EventTypeRegistry.WORKER_SETTLEMENT_CALCULATED,
  EventTypeRegistry.WORKER_SETTLEMENT_PAID,
  EventTypeRegistry.AUDIT_LOG_CREATED,
] as const)

export const DomainEntityRegistry = {
  Branch: 'Branch',
  User: 'User',
  Service: 'Service',
  Worker: 'Worker',
  Sale: 'Sale',
  SaleClient: 'SaleClient',
  SaleItem: 'SaleItem',
  SplitPayment: 'SplitPayment',
  Refund: 'Refund',
  WorkerSettlement: 'WorkerSettlement',
  AuditLog: 'AuditLog',
  OfflineQueueItem: 'OfflineQueueItem',
} as const

export type DomainEntityName =
  (typeof DomainEntityRegistry)[keyof typeof DomainEntityRegistry]

export const DomainEntityRegistryValues = defineUniqueRegistryValues([
  DomainEntityRegistry.Branch,
  DomainEntityRegistry.User,
  DomainEntityRegistry.Service,
  DomainEntityRegistry.Worker,
  DomainEntityRegistry.Sale,
  DomainEntityRegistry.SaleClient,
  DomainEntityRegistry.SaleItem,
  DomainEntityRegistry.SplitPayment,
  DomainEntityRegistry.Refund,
  DomainEntityRegistry.WorkerSettlement,
  DomainEntityRegistry.AuditLog,
  DomainEntityRegistry.OfflineQueueItem,
] as const)

export const ProjectionRegistry = {
  SalesProjection: 'sales_projection',
  SaleItemsProjection: 'sale_items_projection',
  WorkerEarningsProjection: 'worker_earnings_projection',
  BranchRevenueProjection: 'branch_revenue_projection',
  RefundProjection: 'refund_projection',
  AuditProjection: 'audit_projection',
  ProjectionProcessedEvents: 'projection_processed_events',
} as const

export type ProjectionName =
  (typeof ProjectionRegistry)[keyof typeof ProjectionRegistry]

export const ProjectionRegistryValues = defineUniqueRegistryValues([
  ProjectionRegistry.SalesProjection,
  ProjectionRegistry.SaleItemsProjection,
  ProjectionRegistry.WorkerEarningsProjection,
  ProjectionRegistry.BranchRevenueProjection,
  ProjectionRegistry.RefundProjection,
  ProjectionRegistry.AuditProjection,
  ProjectionRegistry.ProjectionProcessedEvents,
] as const)

export const APIActionRegistry = {
  HealthCheck: 'GET /health',
  IngestEvent: 'POST /api/events',
  InitiateMpesaStkPush: 'POST /api/mpesa/stk-push',
  ReceiveMpesaCallback: 'POST /api/mpesa/callback',
  RetrySyncBatch: 'POST /api/sync/retry',
} as const

export type APIActionName =
  (typeof APIActionRegistry)[keyof typeof APIActionRegistry]

export const APIActionRegistryValues = defineUniqueRegistryValues([
  APIActionRegistry.HealthCheck,
  APIActionRegistry.IngestEvent,
  APIActionRegistry.InitiateMpesaStkPush,
  APIActionRegistry.ReceiveMpesaCallback,
  APIActionRegistry.RetrySyncBatch,
] as const)

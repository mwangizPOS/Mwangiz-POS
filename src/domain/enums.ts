export const SystemRole = {
  SuperAdmin: 'SuperAdmin',
  BranchManager: 'BranchManager',
  Cashier: 'Cashier',
} as const

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole]

export const systemRoleValues = [
  SystemRole.SuperAdmin,
  SystemRole.BranchManager,
  SystemRole.Cashier,
] as const

export const PaymentMethod = {
  Cash: 'Cash',
  Mpesa: 'Mpesa',
  Bank: 'Bank',
  Mixed: 'Mixed',
} as const

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const paymentMethodValues = [
  PaymentMethod.Cash,
  PaymentMethod.Mpesa,
  PaymentMethod.Bank,
  PaymentMethod.Mixed,
] as const

export const SaleStatus = {
  Pending: 'Pending',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  Refunded: 'Refunded',
  PartiallyRefunded: 'PartiallyRefunded',
} as const

export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus]

export const saleStatusValues = [
  SaleStatus.Pending,
  SaleStatus.Completed,
  SaleStatus.Cancelled,
  SaleStatus.Refunded,
  SaleStatus.PartiallyRefunded,
] as const

export const SaleItemStatus = {
  Active: 'Active',
  Removed: 'Removed',
  Refunded: 'Refunded',
  PartiallyRefunded: 'PartiallyRefunded',
} as const

export type SaleItemStatus = (typeof SaleItemStatus)[keyof typeof SaleItemStatus]

export const saleItemStatusValues = [
  SaleItemStatus.Active,
  SaleItemStatus.Removed,
  SaleItemStatus.Refunded,
  SaleItemStatus.PartiallyRefunded,
] as const

export const PaymentStatus = {
  Pending: 'Pending',
  Paid: 'Paid',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
  Refunded: 'Refunded',
  PartiallyRefunded: 'PartiallyRefunded',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const paymentStatusValues = [
  PaymentStatus.Pending,
  PaymentStatus.Paid,
  PaymentStatus.Failed,
  PaymentStatus.Cancelled,
  PaymentStatus.Refunded,
  PaymentStatus.PartiallyRefunded,
] as const

export const RefundStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Completed: 'Completed',
} as const

export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus]

export const refundStatusValues = [
  RefundStatus.Pending,
  RefundStatus.Approved,
  RefundStatus.Rejected,
  RefundStatus.Completed,
] as const

export const RefundType = {
  Partial: 'Partial',
  Full: 'Full',
} as const

export type RefundType = (typeof RefundType)[keyof typeof RefundType]

export const refundTypeValues = [RefundType.Partial, RefundType.Full] as const

export const RefundTarget = {
  Sale: 'Sale',
  SaleItem: 'SaleItem',
} as const

export type RefundTarget = (typeof RefundTarget)[keyof typeof RefundTarget]

export const refundTargetValues = [
  RefundTarget.Sale,
  RefundTarget.SaleItem,
] as const

export const SettlementStatus = {
  Pending: 'Pending',
  Paid: 'Paid',
} as const

export type SettlementStatus = (typeof SettlementStatus)[keyof typeof SettlementStatus]

export const settlementStatusValues = [
  SettlementStatus.Pending,
  SettlementStatus.Paid,
] as const

export const SyncStatus = {
  Pending: 'Pending',
  Synced: 'Synced',
  Failed: 'Failed',
} as const

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus]

export const syncStatusValues = [
  SyncStatus.Pending,
  SyncStatus.Synced,
  SyncStatus.Failed,
] as const

export const AuditEntityType = {
  Branch: 'Branch',
  Service: 'Service',
  Worker: 'Worker',
  Sale: 'Sale',
  SaleItem: 'SaleItem',
  SaleClient: 'SaleClient',
  SplitPayment: 'SplitPayment',
  Refund: 'Refund',
  WorkerSettlement: 'WorkerSettlement',
  OfflineQueueItem: 'OfflineQueueItem',
} as const

export type AuditEntityType = (typeof AuditEntityType)[keyof typeof AuditEntityType]

export const auditEntityTypeValues = [
  AuditEntityType.Branch,
  AuditEntityType.Service,
  AuditEntityType.Worker,
  AuditEntityType.Sale,
  AuditEntityType.SaleItem,
  AuditEntityType.SaleClient,
  AuditEntityType.SplitPayment,
  AuditEntityType.Refund,
  AuditEntityType.WorkerSettlement,
  AuditEntityType.OfflineQueueItem,
] as const

export const AuditAction = {
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
  SettlementPaid: 'SettlementPaid',
  PriceChanged: 'PriceChanged',
  ServiceModified: 'ServiceModified',
} as const

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]

export const auditActionValues = [
  AuditAction.SaleCreated,
  AuditAction.SaleCompleted,
  AuditAction.SaleCancelled,
  AuditAction.SaleItemAdded,
  AuditAction.SaleItemUpdated,
  AuditAction.SaleItemRemoved,
  AuditAction.PaymentInitiated,
  AuditAction.PaymentCompleted,
  AuditAction.SplitPaymentRecorded,
  AuditAction.RefundRequested,
  AuditAction.RefundApproved,
  AuditAction.RefundRejected,
  AuditAction.RefundProcessed,
  AuditAction.WorkerSettlementCalculated,
  AuditAction.WorkerPaid,
  AuditAction.WorkerSettlementMarkedPaid,
  AuditAction.SettlementPaid,
  AuditAction.PriceChanged,
  AuditAction.ServiceModified,
] as const

export const OfflineActionType = {
  CreateSale: 'CreateSale',
  CreateRefund: 'CreateRefund',
  CreateWorker: 'CreateWorker',
  UpdateWorker: 'UpdateWorker',
  CreateService: 'CreateService',
  UpdateService: 'UpdateService',
  CreateBranch: 'CreateBranch',
  UpdateBranch: 'UpdateBranch',
  CreateSettlement: 'CreateSettlement',
} as const

export type OfflineActionType = (typeof OfflineActionType)[keyof typeof OfflineActionType]

export const offlineActionTypeValues = [
  OfflineActionType.CreateSale,
  OfflineActionType.CreateRefund,
  OfflineActionType.CreateWorker,
  OfflineActionType.UpdateWorker,
  OfflineActionType.CreateService,
  OfflineActionType.UpdateService,
  OfflineActionType.CreateBranch,
  OfflineActionType.UpdateBranch,
  OfflineActionType.CreateSettlement,
] as const

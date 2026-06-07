import { LegacyEventTypeNameRegistry } from '@/contracts/mapping'
import { DomainEntityRegistry } from '@/contracts/registry'

export const EventAggregateType = {
  Sale: DomainEntityRegistry.Sale,
  Worker: DomainEntityRegistry.Worker,
  Branch: DomainEntityRegistry.Branch,
} as const

export type EventAggregateType =
  (typeof EventAggregateType)[keyof typeof EventAggregateType]

export const eventAggregateTypeValues = [
  EventAggregateType.Sale,
  EventAggregateType.Worker,
  EventAggregateType.Branch,
] as const

export const EventType = {
  SaleCreated: LegacyEventTypeNameRegistry.SaleCreated,
  SaleCompleted: LegacyEventTypeNameRegistry.SaleCompleted,
  SaleCancelled: LegacyEventTypeNameRegistry.SaleCancelled,
  SaleItemAdded: LegacyEventTypeNameRegistry.SaleItemAdded,
  SaleItemUpdated: LegacyEventTypeNameRegistry.SaleItemUpdated,
  SaleItemRemoved: LegacyEventTypeNameRegistry.SaleItemRemoved,
  PaymentInitiated: LegacyEventTypeNameRegistry.PaymentInitiated,
  PaymentCompleted: LegacyEventTypeNameRegistry.PaymentCompleted,
  SplitPaymentRecorded: LegacyEventTypeNameRegistry.SplitPaymentRecorded,
  RefundRequested: LegacyEventTypeNameRegistry.RefundRequested,
  RefundApproved: LegacyEventTypeNameRegistry.RefundApproved,
  RefundRejected: LegacyEventTypeNameRegistry.RefundRejected,
  RefundProcessed: LegacyEventTypeNameRegistry.RefundProcessed,
  WorkerSettlementCalculated: LegacyEventTypeNameRegistry.WorkerSettlementCalculated,
  WorkerPaid: LegacyEventTypeNameRegistry.WorkerPaid,
  WorkerSettlementMarkedPaid: LegacyEventTypeNameRegistry.WorkerSettlementMarkedPaid,
  AuditLogCreated: LegacyEventTypeNameRegistry.AuditLogCreated,
} as const

export type EventType = (typeof EventType)[keyof typeof EventType]

export const eventTypeValues = [
  EventType.SaleCreated,
  EventType.SaleCompleted,
  EventType.SaleCancelled,
  EventType.SaleItemAdded,
  EventType.SaleItemUpdated,
  EventType.SaleItemRemoved,
  EventType.PaymentInitiated,
  EventType.PaymentCompleted,
  EventType.SplitPaymentRecorded,
  EventType.RefundRequested,
  EventType.RefundApproved,
  EventType.RefundRejected,
  EventType.RefundProcessed,
  EventType.WorkerSettlementCalculated,
  EventType.WorkerPaid,
  EventType.WorkerSettlementMarkedPaid,
  EventType.AuditLogCreated,
] as const

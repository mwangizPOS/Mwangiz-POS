import { EventAggregateType, EventType } from './eventTypes.js'
import type { DomainEventEnvelope, IntegrationEventEnvelope } from './envelope.js'
import type {
  AuditLogCreatedPayload,
  PaymentCompletedPayload,
  PaymentInitiatedPayload,
  RefundApprovedPayload,
  RefundProcessedPayload,
  RefundRejectedPayload,
  RefundRequestedPayload,
  SaleCancelledPayload,
  SaleCompletedPayload,
  SaleCreatedPayload,
  SaleItemAddedPayload,
  SaleItemRemovedPayload,
  SaleItemUpdatedPayload,
  SplitPaymentRecordedPayload,
  WorkerPaidPayload,
  WorkerSettlementCalculatedPayload,
  WorkerSettlementMarkedPaidPayload,
} from './payloads.js'

export type SaleCreatedEvent = DomainEventEnvelope<
  typeof EventType.SaleCreated,
  typeof EventAggregateType.Sale,
  SaleCreatedPayload
>

export type SaleCompletedEvent = DomainEventEnvelope<
  typeof EventType.SaleCompleted,
  typeof EventAggregateType.Sale,
  SaleCompletedPayload
>

export type SaleCancelledEvent = DomainEventEnvelope<
  typeof EventType.SaleCancelled,
  typeof EventAggregateType.Sale,
  SaleCancelledPayload
>

export type SaleItemAddedEvent = DomainEventEnvelope<
  typeof EventType.SaleItemAdded,
  typeof EventAggregateType.Sale,
  SaleItemAddedPayload
>

export type SaleItemUpdatedEvent = DomainEventEnvelope<
  typeof EventType.SaleItemUpdated,
  typeof EventAggregateType.Sale,
  SaleItemUpdatedPayload
>

export type SaleItemRemovedEvent = DomainEventEnvelope<
  typeof EventType.SaleItemRemoved,
  typeof EventAggregateType.Sale,
  SaleItemRemovedPayload
>

export type PaymentInitiatedEvent = DomainEventEnvelope<
  typeof EventType.PaymentInitiated,
  typeof EventAggregateType.Sale,
  PaymentInitiatedPayload
>

export type PaymentCompletedEvent = DomainEventEnvelope<
  typeof EventType.PaymentCompleted,
  typeof EventAggregateType.Sale,
  PaymentCompletedPayload
>

export type SplitPaymentRecordedEvent = DomainEventEnvelope<
  typeof EventType.SplitPaymentRecorded,
  typeof EventAggregateType.Sale,
  SplitPaymentRecordedPayload
>

export type RefundRequestedEvent = DomainEventEnvelope<
  typeof EventType.RefundRequested,
  typeof EventAggregateType.Sale,
  RefundRequestedPayload
>

export type RefundApprovedEvent = DomainEventEnvelope<
  typeof EventType.RefundApproved,
  typeof EventAggregateType.Sale,
  RefundApprovedPayload
>

export type RefundRejectedEvent = DomainEventEnvelope<
  typeof EventType.RefundRejected,
  typeof EventAggregateType.Sale,
  RefundRejectedPayload
>

export type RefundProcessedEvent = DomainEventEnvelope<
  typeof EventType.RefundProcessed,
  typeof EventAggregateType.Sale,
  RefundProcessedPayload
>

export type WorkerSettlementCalculatedEvent = DomainEventEnvelope<
  typeof EventType.WorkerSettlementCalculated,
  typeof EventAggregateType.Worker,
  WorkerSettlementCalculatedPayload
>

export type WorkerPaidEvent = DomainEventEnvelope<
  typeof EventType.WorkerPaid,
  typeof EventAggregateType.Worker,
  WorkerPaidPayload
>

export type WorkerSettlementMarkedPaidEvent = DomainEventEnvelope<
  typeof EventType.WorkerSettlementMarkedPaid,
  typeof EventAggregateType.Worker,
  WorkerSettlementMarkedPaidPayload
>

export type AuditLogCreatedEvent = IntegrationEventEnvelope<
  typeof EventType.AuditLogCreated,
  typeof EventAggregateType.Branch,
  AuditLogCreatedPayload
>

export type SaleDomainEvent =
  | SaleCreatedEvent
  | SaleCompletedEvent
  | SaleCancelledEvent
  | SaleItemAddedEvent
  | SaleItemUpdatedEvent
  | SaleItemRemovedEvent
  | PaymentInitiatedEvent
  | PaymentCompletedEvent
  | SplitPaymentRecordedEvent
  | RefundRequestedEvent
  | RefundApprovedEvent
  | RefundRejectedEvent
  | RefundProcessedEvent

export type SettlementDomainEvent =
  | WorkerSettlementCalculatedEvent
  | WorkerPaidEvent
  | WorkerSettlementMarkedPaidEvent

export type AuditIntegrationEvent = AuditLogCreatedEvent

export type DomainEvent = SaleDomainEvent | SettlementDomainEvent

export type IntegrationEvent = AuditIntegrationEvent

export type AppEvent = DomainEvent | IntegrationEvent

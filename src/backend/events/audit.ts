import type { AuditLogProjection } from './projectionTypes'
import type { ProjectionStore } from './store'
import { AuditAction, AuditEntityType } from '@/domain/enums'
import { EventType, type AppEvent } from '@/events'

export async function emitAuditLog(store: ProjectionStore, event: AppEvent) {
  const action = getAuditAction(event)

  if (!action) {
    return undefined
  }

  const auditLog: AuditLogProjection = {
    id: `${event.event_id}:audit`,
    action,
    entityType: getAuditEntityType(event),
    entityId: event.aggregate_id,
    performedBy: event.actor_id,
    branchId: event.branch_id,
    metadata: {
      sourceEventId: event.event_id,
      eventType: event.event_type,
      idempotencyKey: event.idempotency_key,
    },
    timestamp: event.timestamp,
  }

  await store.saveAuditLog(auditLog)
  return auditLog
}

function getAuditAction(event: AppEvent) {
  switch (event.event_type) {
    case EventType.SaleCreated:
      return AuditAction.SaleCreated
    case EventType.SaleCompleted:
      return AuditAction.SaleCompleted
    case EventType.SaleCancelled:
      return AuditAction.SaleCancelled
    case EventType.SaleItemAdded:
      return AuditAction.SaleItemAdded
    case EventType.SaleItemUpdated:
      return AuditAction.SaleItemUpdated
    case EventType.SaleItemRemoved:
      return AuditAction.SaleItemRemoved
    case EventType.PaymentInitiated:
      return AuditAction.PaymentInitiated
    case EventType.PaymentCompleted:
      return AuditAction.PaymentCompleted
    case EventType.SplitPaymentRecorded:
      return AuditAction.SplitPaymentRecorded
    case EventType.RefundRequested:
      return AuditAction.RefundRequested
    case EventType.RefundApproved:
      return AuditAction.RefundApproved
    case EventType.RefundRejected:
      return AuditAction.RefundRejected
    case EventType.RefundProcessed:
      return AuditAction.RefundProcessed
    case EventType.WorkerSettlementCalculated:
      return AuditAction.WorkerSettlementCalculated
    case EventType.WorkerPaid:
      return AuditAction.WorkerPaid
    case EventType.WorkerSettlementMarkedPaid:
      return AuditAction.WorkerSettlementMarkedPaid
    case EventType.AuditLogCreated:
      return undefined
  }
}

function getAuditEntityType(event: AppEvent) {
  switch (event.event_type) {
    case EventType.SaleItemAdded:
    case EventType.SaleItemUpdated:
    case EventType.SaleItemRemoved:
      return AuditEntityType.SaleItem
    case EventType.RefundRequested:
    case EventType.RefundApproved:
    case EventType.RefundRejected:
    case EventType.RefundProcessed:
      return AuditEntityType.Refund
    case EventType.WorkerSettlementCalculated:
    case EventType.WorkerPaid:
    case EventType.WorkerSettlementMarkedPaid:
      return AuditEntityType.WorkerSettlement
    case EventType.AuditLogCreated:
      return AuditEntityType.Branch
    default:
      return AuditEntityType.Sale
  }
}

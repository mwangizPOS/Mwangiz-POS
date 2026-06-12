import { z } from 'zod'
import {
  EventAggregateType,
  EventType,
  eventAggregateTypeValues,
  eventTypeValues,
} from '../events/index.js'
import {
  auditActionSchema,
  auditEntityTypeSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  refundStatusSchema,
  refundTargetSchema,
  refundTypeSchema,
  saleItemStatusSchema,
  saleStatusSchema,
  settlementStatusSchema,
} from './domainSchemas.js'
import {
  dateTimeStringSchema,
  entityIdSchema,
  idempotencyKeySchema,
  longTextSchema,
  metadataSchema,
  moneyAmountSchema,
  percentageSchema,
  positiveMoneyAmountSchema,
  shortTextSchema,
  uuidSchema,
} from './sharedSchemas.js'

export const eventTypeSchema = z.enum(eventTypeValues)

export const eventAggregateTypeSchema = z.enum(eventAggregateTypeValues)

export const eventEnvelopeBaseSchema = z.object({
  event_id: uuidSchema,
  event_type: eventTypeSchema,
  aggregate_id: entityIdSchema,
  aggregate_type: eventAggregateTypeSchema,
  branch_id: entityIdSchema,
  timestamp: dateTimeStringSchema,
  actor_id: entityIdSchema,
  version: z.number().int().positive(),
  idempotency_key: idempotencyKeySchema,
})

export const saleClientLabelPayloadSchema = z.object({
  saleClientId: entityIdSchema,
  label: shortTextSchema,
})

export const saleCreatedPayloadSchema = z.object({
  saleId: entityIdSchema,
  saleNumber: shortTextSchema,
  branchId: entityIdSchema,
  status: saleStatusSchema,
  clients: z.array(saleClientLabelPayloadSchema),
})

export const saleCompletedPayloadSchema = z.object({
  saleId: entityIdSchema,
  totalAmount: moneyAmountSchema,
  status: saleStatusSchema,
  completedAt: dateTimeStringSchema,
})

export const saleCancelledPayloadSchema = z.object({
  saleId: entityIdSchema,
  status: saleStatusSchema,
  reason: longTextSchema,
})

export const saleItemAddedPayloadSchema = z.object({
  saleId: entityIdSchema,
  saleItemId: entityIdSchema,
  saleClientId: entityIdSchema.nullable().optional(),
  serviceId: entityIdSchema,
  workerId: entityIdSchema,
  quantity: z.number().int().positive(),
  price: positiveMoneyAmountSchema,
  commissionRateSnapshot: percentageSchema,
  status: saleItemStatusSchema,
})

export const saleItemUpdatedPayloadSchema = z.object({
  saleId: entityIdSchema,
  saleItemId: entityIdSchema,
  saleClientId: entityIdSchema.nullable().optional(),
  serviceId: entityIdSchema.optional(),
  workerId: entityIdSchema.optional(),
  quantity: z.number().int().positive().optional(),
  price: positiveMoneyAmountSchema.optional(),
  commissionRateSnapshot: percentageSchema.optional(),
  status: saleItemStatusSchema.optional(),
})

export const saleItemRemovedPayloadSchema = z.object({
  saleId: entityIdSchema,
  saleItemId: entityIdSchema,
  status: saleItemStatusSchema,
  reason: longTextSchema,
})

export const paymentInitiatedPayloadSchema = z.object({
  saleId: entityIdSchema,
  paymentMethod: paymentMethodSchema,
  amount: positiveMoneyAmountSchema,
  paymentStatus: paymentStatusSchema,
  providerRequestId: shortTextSchema.nullable().optional(),
  merchantRequestId: shortTextSchema.nullable().optional(),
})

export const paymentCompletedPayloadSchema = z.object({
  saleId: entityIdSchema,
  paymentMethod: paymentMethodSchema,
  amount: positiveMoneyAmountSchema,
  paymentStatus: paymentStatusSchema,
  paymentReference: shortTextSchema.nullable().optional(),
  providerRequestId: shortTextSchema.nullable().optional(),
  merchantRequestId: shortTextSchema.nullable().optional(),
  completedAt: dateTimeStringSchema,
})

export const splitPaymentComponentPayloadSchema = z.object({
  method: paymentMethodSchema,
  amount: moneyAmountSchema,
})

export const splitPaymentRecordedPayloadSchema = z.object({
  saleId: entityIdSchema,
  splitPaymentId: entityIdSchema,
  amount: positiveMoneyAmountSchema,
  components: z.array(splitPaymentComponentPayloadSchema).min(1),
})

export const refundRequestedPayloadSchema = z.object({
  refundId: entityIdSchema,
  saleId: entityIdSchema.nullable().optional(),
  saleItemId: entityIdSchema.nullable().optional(),
  refundTarget: refundTargetSchema,
  refundType: refundTypeSchema,
  amount: positiveMoneyAmountSchema,
  reason: longTextSchema,
  status: refundStatusSchema,
})

export const refundApprovedPayloadSchema = z.object({
  refundId: entityIdSchema,
  approvedBy: entityIdSchema,
  approvedAt: dateTimeStringSchema,
  status: refundStatusSchema,
})

export const refundRejectedPayloadSchema = z.object({
  refundId: entityIdSchema,
  rejectedBy: entityIdSchema,
  rejectedAt: dateTimeStringSchema,
  rejectionReason: longTextSchema,
  status: refundStatusSchema,
})

export const refundProcessedPayloadSchema = z.object({
  refundId: entityIdSchema,
  processedAmount: positiveMoneyAmountSchema,
  processedAt: dateTimeStringSchema,
  status: refundStatusSchema,
})

export const workerSettlementCalculatedPayloadSchema = z.object({
  settlementId: entityIdSchema,
  workerId: entityIdSchema,
  periodStart: dateTimeStringSchema,
  periodEnd: dateTimeStringSchema,
  totalEarned: moneyAmountSchema,
  saleItemIds: z.array(entityIdSchema),
  status: settlementStatusSchema,
})

export const workerPaidPayloadSchema = z.object({
  workerId: entityIdSchema,
  settlementId: entityIdSchema,
  amount: positiveMoneyAmountSchema,
  paidBy: entityIdSchema,
  paidAt: dateTimeStringSchema,
})

export const workerSettlementMarkedPaidPayloadSchema = z.object({
  settlementId: entityIdSchema,
  workerId: entityIdSchema,
  status: settlementStatusSchema,
  paidBy: entityIdSchema,
  paidAt: dateTimeStringSchema,
})

export const auditLogCreatedPayloadSchema = z.object({
  auditLogId: entityIdSchema,
  action: auditActionSchema,
  entityType: auditEntityTypeSchema,
  entityId: entityIdSchema,
  performedBy: entityIdSchema,
  branchId: entityIdSchema,
  metadata: metadataSchema,
})

export const saleCreatedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.SaleCreated),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: saleCreatedPayloadSchema,
})

export const saleCompletedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.SaleCompleted),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: saleCompletedPayloadSchema,
})

export const saleCancelledEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.SaleCancelled),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: saleCancelledPayloadSchema,
})

export const saleItemAddedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.SaleItemAdded),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: saleItemAddedPayloadSchema,
})

export const saleItemUpdatedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.SaleItemUpdated),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: saleItemUpdatedPayloadSchema,
})

export const saleItemRemovedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.SaleItemRemoved),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: saleItemRemovedPayloadSchema,
})

export const paymentInitiatedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.PaymentInitiated),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: paymentInitiatedPayloadSchema,
})

export const paymentCompletedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.PaymentCompleted),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: paymentCompletedPayloadSchema,
})

export const splitPaymentRecordedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.SplitPaymentRecorded),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: splitPaymentRecordedPayloadSchema,
})

export const refundRequestedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.RefundRequested),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: refundRequestedPayloadSchema,
})

export const refundApprovedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.RefundApproved),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: refundApprovedPayloadSchema,
})

export const refundRejectedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.RefundRejected),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: refundRejectedPayloadSchema,
})

export const refundProcessedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.RefundProcessed),
  aggregate_type: z.literal(EventAggregateType.Sale),
  payload: refundProcessedPayloadSchema,
})

export const workerSettlementCalculatedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.WorkerSettlementCalculated),
  aggregate_type: z.literal(EventAggregateType.Worker),
  payload: workerSettlementCalculatedPayloadSchema,
})

export const workerPaidEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.WorkerPaid),
  aggregate_type: z.literal(EventAggregateType.Worker),
  payload: workerPaidPayloadSchema,
})

export const workerSettlementMarkedPaidEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.WorkerSettlementMarkedPaid),
  aggregate_type: z.literal(EventAggregateType.Worker),
  payload: workerSettlementMarkedPaidPayloadSchema,
})

export const auditLogCreatedEventSchema = eventEnvelopeBaseSchema.extend({
  event_type: z.literal(EventType.AuditLogCreated),
  aggregate_type: z.literal(EventAggregateType.Branch),
  payload: auditLogCreatedPayloadSchema,
})

export const appEventSchema = z.discriminatedUnion('event_type', [
  saleCreatedEventSchema,
  saleCompletedEventSchema,
  saleCancelledEventSchema,
  saleItemAddedEventSchema,
  saleItemUpdatedEventSchema,
  saleItemRemovedEventSchema,
  paymentInitiatedEventSchema,
  paymentCompletedEventSchema,
  splitPaymentRecordedEventSchema,
  refundRequestedEventSchema,
  refundApprovedEventSchema,
  refundRejectedEventSchema,
  refundProcessedEventSchema,
  workerSettlementCalculatedEventSchema,
  workerPaidEventSchema,
  workerSettlementMarkedPaidEventSchema,
  auditLogCreatedEventSchema,
])

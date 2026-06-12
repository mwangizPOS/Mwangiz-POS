import { z } from 'zod'
import { paymentMethodSchema, paymentStatusSchema } from './domainSchemas.js'
import {
  paymentCompletedEventSchema,
  paymentInitiatedEventSchema,
  splitPaymentRecordedEventSchema,
} from './eventSchemas.js'
import {
  entityIdSchema,
  idempotencyKeySchema,
  moneyAmountSchema,
  positiveMoneyAmountSchema,
  shortTextSchema,
} from './sharedSchemas.js'

export const initiatePaymentRequestSchema = z.object({
  saleId: entityIdSchema,
  branchId: entityIdSchema,
  actorId: entityIdSchema,
  paymentMethod: paymentMethodSchema,
  amount: positiveMoneyAmountSchema,
  idempotencyKey: idempotencyKeySchema,
})

export const initiatePaymentResponseSchema = z.object({
  saleId: entityIdSchema,
  paymentStatus: paymentStatusSchema,
  event: paymentInitiatedEventSchema,
})

export const confirmPaymentRequestSchema = z.object({
  saleId: entityIdSchema,
  branchId: entityIdSchema,
  actorId: entityIdSchema,
  paymentMethod: paymentMethodSchema,
  amount: positiveMoneyAmountSchema,
  paymentReference: shortTextSchema.nullable().optional(),
  idempotencyKey: idempotencyKeySchema,
})

export const confirmPaymentResponseSchema = z.object({
  saleId: entityIdSchema,
  paymentStatus: paymentStatusSchema,
  event: paymentCompletedEventSchema,
})

export const splitPaymentComponentRequestSchema = z.object({
  method: paymentMethodSchema,
  amount: moneyAmountSchema,
})

export const splitPaymentRequestSchema = z.object({
  saleId: entityIdSchema,
  branchId: entityIdSchema,
  actorId: entityIdSchema,
  amount: positiveMoneyAmountSchema,
  components: z.array(splitPaymentComponentRequestSchema).min(1),
  idempotencyKey: idempotencyKeySchema,
})

export const splitPaymentResponseSchema = z.object({
  saleId: entityIdSchema,
  splitPaymentId: entityIdSchema,
  event: splitPaymentRecordedEventSchema,
})

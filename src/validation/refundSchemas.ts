import { z } from 'zod'
import { refundSchema, refundTargetSchema, refundTypeSchema } from './domainSchemas'
import {
  refundApprovedEventSchema,
  refundRequestedEventSchema,
} from './eventSchemas'
import {
  entityIdSchema,
  idempotencyKeySchema,
  longTextSchema,
  positiveMoneyAmountSchema,
} from './sharedSchemas'

export const createRefundRequestSchema = z.object({
  saleId: entityIdSchema.nullable().optional(),
  saleItemId: entityIdSchema.nullable().optional(),
  refundTarget: refundTargetSchema,
  refundType: refundTypeSchema,
  amount: positiveMoneyAmountSchema,
  reason: longTextSchema,
  branchId: entityIdSchema,
  actorId: entityIdSchema,
  idempotencyKey: idempotencyKeySchema,
})

export const createRefundResponseSchema = z.object({
  refundId: entityIdSchema,
  refund: refundSchema,
  event: refundRequestedEventSchema,
})

export const approveRefundRequestSchema = z.object({
  refundId: entityIdSchema,
  branchId: entityIdSchema,
  actorId: entityIdSchema,
  idempotencyKey: idempotencyKeySchema,
})

export const approveRefundResponseSchema = z.object({
  refundId: entityIdSchema,
  refund: refundSchema,
  event: refundApprovedEventSchema,
})

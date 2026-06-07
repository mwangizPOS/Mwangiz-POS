import { z } from 'zod'
import { appEventSchema } from './eventSchemas'
import {
  entityIdSchema,
  idempotencyKeySchema,
  longTextSchema,
  moneyAmountSchema,
  phoneSchema,
  shortTextSchema,
  uuidSchema,
} from './sharedSchemas'

export const eventIngestionRequestSchema = appEventSchema

export const mpesaStkPushRequestSchema = z.object({
  phone_number: phoneSchema,
  amount: moneyAmountSchema.refine((amount) => amount > 0, {
    message: 'Amount must be greater than zero.',
  }),
  sale_id: uuidSchema,
  branch_id: uuidSchema,
  actor_id: uuidSchema,
  idempotency_key: idempotencyKeySchema,
  account_reference: shortTextSchema.optional(),
  description: longTextSchema.optional(),
})

export const mpesaCallbackRequestSchema = z.record(z.string(), z.unknown())

export const syncRetryRequestSchema = z.object({
  batchId: entityIdSchema,
  branchId: entityIdSchema,
  deviceId: entityIdSchema,
  events: z.array(appEventSchema).min(1),
})

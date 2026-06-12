import { z } from 'zod'
import { syncEventStatusValues } from '../contracts/sync.js'
import { appEventSchema, eventEnvelopeBaseSchema } from './eventSchemas.js'
import {
  dateTimeStringSchema,
  entityIdSchema,
  metadataSchema,
  retryCountSchema,
  shortTextSchema,
} from './sharedSchemas.js'

export const syncEventStatusSchema = z.enum(syncEventStatusValues)

export const syncEventSchema = z.object({
  local_id: entityIdSchema,
  event_envelope: appEventSchema,
  status: syncEventStatusSchema,
  retry_count: retryCountSchema,
})

export const syncQueueRequestSchema = z.object({
  branchId: entityIdSchema,
  deviceId: entityIdSchema,
  events: z.array(syncEventSchema),
})

export const syncEventResultSchema = z.object({
  localId: entityIdSchema,
  eventId: entityIdSchema,
  idempotencyKey: shortTextSchema,
  status: syncEventStatusSchema,
  message: shortTextSchema.optional(),
  metadata: metadataSchema.optional(),
})

export const syncQueueResponseSchema = z.object({
  branchId: entityIdSchema,
  deviceId: entityIdSchema,
  accepted: z.array(syncEventResultSchema),
  rejected: z.array(syncEventResultSchema),
  syncedAt: dateTimeStringSchema,
})

export const syncEventBatchRequestSchema = z.object({
  batchId: entityIdSchema,
  branchId: entityIdSchema,
  deviceId: entityIdSchema,
  events: z.array(eventEnvelopeBaseSchema.extend({ payload: z.record(z.string(), z.unknown()) })),
})

export const syncEventBatchResponseSchema = z.object({
  batchId: entityIdSchema,
  accepted: z.array(syncEventResultSchema),
  duplicates: z.array(syncEventResultSchema),
  rejected: z.array(syncEventResultSchema),
  processedAt: dateTimeStringSchema,
})

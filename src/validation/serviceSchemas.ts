import { z } from 'zod'
import { serviceSchema } from './domainSchemas.js'
import {
  entityIdSchema,
  moneyAmountSchema,
  percentageSchema,
  shortTextSchema,
} from './sharedSchemas.js'

export const createServiceRequestSchema = z.object({
  name: shortTextSchema,
  defaultPrice: moneyAmountSchema,
  commissionPercent: percentageSchema,
  active: z.boolean().optional(),
})

export const updateServiceRequestSchema = z.object({
  id: entityIdSchema,
  name: shortTextSchema.optional(),
  defaultPrice: moneyAmountSchema.optional(),
  commissionPercent: percentageSchema.optional(),
  active: z.boolean().optional(),
})

export const createServiceResponseSchema = z.object({
  service: serviceSchema,
})

export const updateServiceResponseSchema = z.object({
  service: serviceSchema,
})

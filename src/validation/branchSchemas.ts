import { z } from 'zod'
import { branchSchema } from './domainSchemas.js'
import { entityIdSchema, shortTextSchema } from './sharedSchemas.js'

export const createBranchRequestSchema = z.object({
  name: shortTextSchema,
  code: shortTextSchema,
  address: shortTextSchema,
  managerId: entityIdSchema,
  active: z.boolean().optional(),
})

export const updateBranchRequestSchema = z.object({
  id: entityIdSchema,
  name: shortTextSchema.optional(),
  code: shortTextSchema.optional(),
  address: shortTextSchema.optional(),
  managerId: entityIdSchema.optional(),
  active: z.boolean().optional(),
})

export const createBranchResponseSchema = z.object({
  branch: branchSchema,
})

export const updateBranchResponseSchema = z.object({
  branch: branchSchema,
})

import { z } from 'zod'
import { workerSchema } from './domainSchemas'
import {
  entityIdSchema,
  phoneSchema,
  shortTextSchema,
  skillsSchema,
} from './sharedSchemas'

export const createWorkerRequestSchema = z.object({
  branchId: entityIdSchema,
  fullName: shortTextSchema,
  phone: phoneSchema,
  skills: skillsSchema,
  active: z.boolean().optional(),
})

export const updateWorkerRequestSchema = z.object({
  id: entityIdSchema,
  branchId: entityIdSchema.optional(),
  fullName: shortTextSchema.optional(),
  phone: phoneSchema.optional(),
  skills: skillsSchema.optional(),
  active: z.boolean().optional(),
})

export const createWorkerResponseSchema = z.object({
  worker: workerSchema,
})

export const updateWorkerResponseSchema = z.object({
  worker: workerSchema,
})

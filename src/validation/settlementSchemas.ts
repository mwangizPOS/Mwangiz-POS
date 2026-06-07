import { z } from 'zod'
import { workerSettlementSchema } from './domainSchemas'
import {
  workerSettlementCalculatedEventSchema,
  workerSettlementMarkedPaidEventSchema,
} from './eventSchemas'
import {
  dateTimeStringSchema,
  entityIdSchema,
  idempotencyKeySchema,
  positiveMoneyAmountSchema,
} from './sharedSchemas'

export const createSettlementRequestSchema = z.object({
  workerId: entityIdSchema,
  amount: positiveMoneyAmountSchema,
  periodStart: dateTimeStringSchema,
  periodEnd: dateTimeStringSchema,
  paidBy: entityIdSchema,
})

export const createSettlementResponseSchema = z.object({
  settlement: workerSettlementSchema,
})

export const calculateSettlementRequestSchema = z.object({
  workerId: entityIdSchema,
  branchId: entityIdSchema,
  periodStart: dateTimeStringSchema,
  periodEnd: dateTimeStringSchema,
  actorId: entityIdSchema,
  idempotencyKey: idempotencyKeySchema,
})

export const calculateSettlementResponseSchema = z.object({
  settlementId: entityIdSchema,
  workerId: entityIdSchema,
  totalEarned: positiveMoneyAmountSchema,
  saleItemIds: z.array(entityIdSchema),
  event: workerSettlementCalculatedEventSchema,
})

export const markWorkerPaidRequestSchema = z.object({
  settlementId: entityIdSchema,
  workerId: entityIdSchema,
  branchId: entityIdSchema,
  paidBy: entityIdSchema,
  idempotencyKey: idempotencyKeySchema,
})

export const markWorkerPaidResponseSchema = z.object({
  settlementId: entityIdSchema,
  workerId: entityIdSchema,
  event: workerSettlementMarkedPaidEventSchema,
})

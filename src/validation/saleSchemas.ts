import { z } from 'zod'
import {
  saleClientSchema,
  saleItemStatusSchema,
  saleItemSchema,
  saleSchema,
  saleStatusSchema,
  splitPaymentSchema,
} from './domainSchemas'
import {
  saleCompletedEventSchema,
  saleCreatedEventSchema,
  saleItemAddedEventSchema,
} from './eventSchemas'
import {
  entityIdSchema,
  idempotencyKeySchema,
  moneyAmountSchema,
  positiveMoneyAmountSchema,
  percentageSchema,
  shortTextSchema,
} from './sharedSchemas'

export const createSaleClientInputSchema = z.object({
  clientReference: shortTextSchema,
  label: shortTextSchema,
  displayName: shortTextSchema.nullable().optional(),
})

export const createSaleItemRequestSchema = z.object({
  serviceId: entityIdSchema,
  workerId: entityIdSchema,
  quantity: z.number().int().positive().optional(),
  price: positiveMoneyAmountSchema,
  commissionRateSnapshot: percentageSchema,
  saleClientReference: shortTextSchema.nullable().optional(),
})

export const createSplitPaymentRequestSchema = z.object({
  cashAmount: moneyAmountSchema,
  mpesaAmount: moneyAmountSchema,
  bankAmount: moneyAmountSchema,
})

export const createSaleRequestSchema = z.object({
  branchId: entityIdSchema,
  createdBy: entityIdSchema,
  idempotencyKey: idempotencyKeySchema,
  clients: z.array(createSaleClientInputSchema).optional(),
})

export const createSaleResponseSchema = z.object({
  saleId: entityIdSchema,
  saleNumber: shortTextSchema,
  branchId: entityIdSchema,
  status: saleStatusSchema,
  clients: z.array(saleClientSchema),
  event: saleCreatedEventSchema,
})

export const addSaleItemRequestSchema = z.object({
  saleId: entityIdSchema,
  branchId: entityIdSchema,
  actorId: entityIdSchema,
  idempotencyKey: idempotencyKeySchema,
  item: createSaleItemRequestSchema,
})

export const addSaleItemResponseSchema = z.object({
  saleId: entityIdSchema,
  saleItemId: entityIdSchema,
  status: saleItemStatusSchema,
  event: saleItemAddedEventSchema,
})

export const completeSaleRequestSchema = z.object({
  saleId: entityIdSchema,
  branchId: entityIdSchema,
  actorId: entityIdSchema,
  expectedTotalAmount: positiveMoneyAmountSchema,
  idempotencyKey: idempotencyKeySchema,
})

export const completeSaleResponseSchema = z.object({
  saleId: entityIdSchema,
  status: saleStatusSchema,
  totalAmount: moneyAmountSchema,
  event: saleCompletedEventSchema,
})

export const saleSnapshotSchema = saleSchema.extend({
  clients: z.array(saleClientSchema),
  items: z.array(saleItemSchema),
  splitPayment: splitPaymentSchema.optional(),
})

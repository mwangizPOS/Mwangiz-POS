import { z } from 'zod'
import {
  auditActionValues,
  auditEntityTypeValues,
  offlineActionTypeValues,
  paymentMethodValues,
  paymentStatusValues,
  refundTargetValues,
  refundStatusValues,
  refundTypeValues,
  saleItemStatusValues,
  saleStatusValues,
  settlementStatusValues,
  syncStatusValues,
  systemRoleValues,
} from '../domain/enums.js'
import {
  dateTimeStringSchema,
  entityIdSchema,
  metadataSchema,
  moneyAmountSchema,
  percentageSchema,
  phoneSchema,
  retryCountSchema,
  shortTextSchema,
  skillsSchema,
} from './sharedSchemas.js'

export const systemRoleSchema = z.enum(systemRoleValues)

export const paymentMethodSchema = z.enum(paymentMethodValues)

export const paymentStatusSchema = z.enum(paymentStatusValues)

export const saleStatusSchema = z.enum(saleStatusValues)

export const saleItemStatusSchema = z.enum(saleItemStatusValues)

export const refundStatusSchema = z.enum(refundStatusValues)

export const refundTypeSchema = z.enum(refundTypeValues)

export const settlementStatusSchema = z.enum(settlementStatusValues)

export const syncStatusSchema = z.enum(syncStatusValues)

export const auditEntityTypeSchema = z.enum(auditEntityTypeValues)

export const auditActionSchema = z.enum(auditActionValues)

export const offlineActionTypeSchema = z.enum(offlineActionTypeValues)

export const branchSchema = z.object({
  id: entityIdSchema,
  name: shortTextSchema,
  code: shortTextSchema,
  address: shortTextSchema,
  managerId: entityIdSchema,
  active: z.boolean(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
})

export const serviceSchema = z.object({
  id: entityIdSchema,
  name: shortTextSchema,
  defaultPrice: moneyAmountSchema,
  commissionPercent: percentageSchema,
  active: z.boolean(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
})

export const workerSchema = z.object({
  id: entityIdSchema,
  branchId: entityIdSchema,
  fullName: shortTextSchema,
  phone: phoneSchema,
  skills: skillsSchema,
  active: z.boolean(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
})

export const saleSchema = z.object({
  id: entityIdSchema,
  saleNumber: shortTextSchema,
  branchId: entityIdSchema,
  paymentMethod: paymentMethodSchema,
  paymentStatus: paymentStatusSchema,
  subtotal: moneyAmountSchema,
  refundAmount: moneyAmountSchema,
  totalAmount: moneyAmountSchema,
  syncStatus: syncStatusSchema,
  createdBy: entityIdSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
})

export const saleClientSchema = z.object({
  id: entityIdSchema,
  saleId: entityIdSchema,
  label: shortTextSchema,
  displayName: shortTextSchema.nullable(),
  createdAt: dateTimeStringSchema,
})

export const saleItemSchema = z.object({
  id: entityIdSchema,
  saleId: entityIdSchema,
  saleClientId: entityIdSchema.nullable(),
  serviceId: entityIdSchema,
  workerId: entityIdSchema,
  unitPrice: moneyAmountSchema,
  commissionPercent: percentageSchema,
  workerRevenue: moneyAmountSchema,
  salonRevenue: moneyAmountSchema,
  refundedAmount: moneyAmountSchema,
  createdAt: dateTimeStringSchema,
})

export const splitPaymentSchema = z.object({
  id: entityIdSchema,
  saleId: entityIdSchema,
  cashAmount: moneyAmountSchema,
  mpesaAmount: moneyAmountSchema,
  bankAmount: moneyAmountSchema,
})

export const refundTargetSchema = z.enum(refundTargetValues)

export const refundSchema = z.object({
  id: entityIdSchema,
  saleId: entityIdSchema.nullable(),
  saleItemId: entityIdSchema.nullable(),
  refundTarget: refundTargetSchema,
  refundType: refundTypeSchema,
  refundAmount: moneyAmountSchema,
  reason: shortTextSchema,
  status: refundStatusSchema,
  requestedBy: entityIdSchema,
  approvedBy: entityIdSchema.nullable(),
  createdAt: dateTimeStringSchema,
})

export const workerSettlementSchema = z.object({
  id: entityIdSchema,
  workerId: entityIdSchema,
  amount: moneyAmountSchema,
  periodStart: dateTimeStringSchema,
  periodEnd: dateTimeStringSchema,
  paidBy: entityIdSchema,
  status: settlementStatusSchema,
  createdAt: dateTimeStringSchema,
})

export const auditLogSchema = z.object({
  id: entityIdSchema,
  action: auditActionSchema,
  entityType: auditEntityTypeSchema,
  entityId: entityIdSchema,
  performedBy: entityIdSchema,
  branchId: entityIdSchema,
  timestamp: dateTimeStringSchema,
  metadata: metadataSchema,
})

export const offlineQueueItemSchema = z.object({
  id: entityIdSchema,
  actionType: offlineActionTypeSchema,
  payload: metadataSchema,
  syncStatus: syncStatusSchema,
  retryCount: retryCountSchema,
  createdAt: dateTimeStringSchema,
})

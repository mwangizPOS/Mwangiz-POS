import { z } from 'zod'
import { BusinessInvariantCode } from '@/contracts/invariants'

export const businessInvariantCodeSchema = z.enum([
  BusinessInvariantCode.SaleTotalEqualsSaleItems,
  BusinessInvariantCode.WorkerCommissionFromSaleItemsOnly,
  BusinessInvariantCode.RefundWithinRemainingRefundableAmount,
  BusinessInvariantCode.SplitPaymentsEqualSaleTotal,
  BusinessInvariantCode.SaleItemBelongsToExactlyOneSale,
  BusinessInvariantCode.RefundReferencesSaleOrSaleItem,
  BusinessInvariantCode.NoOrphanSaleItems,
])

export const businessInvariantSchema = z.object({
  code: businessInvariantCodeSchema,
  description: z.string().trim().min(1),
  enforcedBy: z.literal('server'),
})

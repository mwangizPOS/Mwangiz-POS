export const BusinessInvariantCode = {
  SaleTotalEqualsSaleItems: 'SaleTotalEqualsSaleItems',
  WorkerCommissionFromSaleItemsOnly: 'WorkerCommissionFromSaleItemsOnly',
  RefundWithinRemainingRefundableAmount: 'RefundWithinRemainingRefundableAmount',
  SplitPaymentsEqualSaleTotal: 'SplitPaymentsEqualSaleTotal',
  SaleItemBelongsToExactlyOneSale: 'SaleItemBelongsToExactlyOneSale',
  RefundReferencesSaleOrSaleItem: 'RefundReferencesSaleOrSaleItem',
  NoOrphanSaleItems: 'NoOrphanSaleItems',
} as const

export type BusinessInvariantCode =
  (typeof BusinessInvariantCode)[keyof typeof BusinessInvariantCode]

export interface BusinessInvariant {
  code: BusinessInvariantCode
  description: string
  enforcedBy: 'server'
}

export const businessInvariants: BusinessInvariant[] = [
  {
    code: BusinessInvariantCode.SaleTotalEqualsSaleItems,
    description: 'Sale total must equal the sum of all sale item prices.',
    enforcedBy: 'server',
  },
  {
    code: BusinessInvariantCode.WorkerCommissionFromSaleItemsOnly,
    description: 'Worker commission must be calculated only from sale items.',
    enforcedBy: 'server',
  },
  {
    code: BusinessInvariantCode.RefundWithinRemainingRefundableAmount,
    description: 'Refunds cannot exceed the remaining refundable amount.',
    enforcedBy: 'server',
  },
  {
    code: BusinessInvariantCode.SplitPaymentsEqualSaleTotal,
    description: 'Split payment components must equal sale total amount.',
    enforcedBy: 'server',
  },
  {
    code: BusinessInvariantCode.SaleItemBelongsToExactlyOneSale,
    description: 'Each sale item must belong to exactly one sale.',
    enforcedBy: 'server',
  },
  {
    code: BusinessInvariantCode.RefundReferencesSaleOrSaleItem,
    description: 'Every refund must reference either a sale or a sale item.',
    enforcedBy: 'server',
  },
  {
    code: BusinessInvariantCode.NoOrphanSaleItems,
    description: 'Sale items without a parent sale are invalid.',
    enforcedBy: 'server',
  },
]

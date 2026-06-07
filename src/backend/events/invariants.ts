import { getSaleItemGross, getSaleItemNet, roundMoney } from './money'
import type { ProjectionStore } from './store'
import { EventProcessingError, EventProcessingErrorCode } from './errors'
import type { SaleItemProjection, SaleProjection } from './projectionTypes'
import { PaymentMethod, PaymentStatus, RefundTarget, SaleItemStatus, SaleStatus } from '@/domain/enums'
import type { EntityId, MoneyAmount } from '@/types/primitives'

export function requireProjection<TProjection>(
  projection: TProjection | undefined,
  message: string,
): TProjection {
  if (!projection) {
    throw new EventProcessingError(EventProcessingErrorCode.MissingProjection, message)
  }

  return projection
}

export function requireInvariant(condition: boolean, message: string) {
  if (!condition) {
    throw new EventProcessingError(EventProcessingErrorCode.InvariantViolation, message)
  }
}

export function getActiveSaleItems(items: SaleItemProjection[]) {
  return items.filter((item) => item.status !== SaleItemStatus.Removed)
}

export async function recalculateSaleTotals(
  store: ProjectionStore,
  saleId: EntityId,
  updatedAt: string,
) {
  const sale = requireProjection(await store.getSale(saleId), `Sale ${saleId} does not exist.`)
  const items = getActiveSaleItems(await store.getSaleItemsBySaleId(saleId))
  const subtotal = roundMoney(items.reduce((sum, item) => sum + getSaleItemGross(item), 0))
  const refundAmount = roundMoney(items.reduce((sum, item) => sum + item.refundedAmount, 0))
  const totalAmount = roundMoney(Math.max(0, subtotal - refundAmount))

  const nextSale: SaleProjection = {
    ...sale,
    subtotal,
    refundAmount,
    totalAmount,
    paymentStatus: getRefundAwarePaymentStatus(sale.paymentStatus, subtotal, refundAmount),
    status: getRefundAwareSaleStatus(sale.status, subtotal, refundAmount),
    updatedAt,
  }

  await store.saveSale(nextSale)
  return nextSale
}

export function assertSaleTotalMatchesItems(sale: SaleProjection, items: SaleItemProjection[]) {
  const activeItems = getActiveSaleItems(items)
  const expectedSubtotal = roundMoney(
    activeItems.reduce((sum, item) => sum + getSaleItemGross(item), 0),
  )
  const expectedRefundAmount = roundMoney(
    activeItems.reduce((sum, item) => sum + item.refundedAmount, 0),
  )
  const expectedTotal = roundMoney(Math.max(0, expectedSubtotal - expectedRefundAmount))

  requireInvariant(
    sale.subtotal === expectedSubtotal && sale.totalAmount === expectedTotal,
    'Sale totals must be derived from sale items.',
  )
}

export function assertSaleItemBelongsToSale(item: SaleItemProjection, saleId: EntityId) {
  requireInvariant(item.saleId === saleId, 'Sale item must belong to exactly one sale.')
}

export function assertRefundReferencesSaleOrItem(
  saleId: EntityId | null | undefined,
  saleItemId: EntityId | null | undefined,
) {
  requireInvariant(
    Boolean(saleId) || Boolean(saleItemId),
    'Refund must reference a sale or a sale item.',
  )
}

export function getRemainingRefundableForItem(item: SaleItemProjection): MoneyAmount {
  return getSaleItemNet(item)
}

export function assertRefundableAmount(
  requestedAmount: MoneyAmount,
  remainingRefundableAmount: MoneyAmount,
) {
  requireInvariant(
    requestedAmount <= remainingRefundableAmount,
    'Refund cannot exceed remaining refundable amount.',
  )
}

export function assertSplitPaymentMatchesSale(
  method: PaymentMethod | null,
  saleTotal: MoneyAmount,
  splitAmount: MoneyAmount,
  componentTotal: MoneyAmount,
) {
  requireInvariant(method === PaymentMethod.Mixed, 'Split payment requires Mixed payment method.')
  requireInvariant(splitAmount === saleTotal, 'Split payment amount must equal sale total.')
  requireInvariant(componentTotal === saleTotal, 'Split payment components must equal sale total.')
}

export async function resolveRefundSaleId(
  store: ProjectionStore,
  refundTarget: RefundTarget,
  saleId: EntityId | null | undefined,
  saleItemId: EntityId | null | undefined,
): Promise<EntityId> {
  assertRefundReferencesSaleOrItem(saleId, saleItemId)

  if (refundTarget === RefundTarget.SaleItem) {
    const item = requireProjection(
      saleItemId ? await store.getSaleItem(saleItemId) : undefined,
      'Sale item refund requires an existing sale item.',
    )
    return item.saleId
  }

  return requireProjection(saleId ?? undefined, 'Sale refund requires an existing sale id.')
}

function getRefundAwarePaymentStatus(
  currentStatus: PaymentStatus,
  subtotal: MoneyAmount,
  refundAmount: MoneyAmount,
) {
  if (refundAmount === 0) {
    return currentStatus
  }

  return refundAmount >= subtotal ? PaymentStatus.Refunded : PaymentStatus.PartiallyRefunded
}

function getRefundAwareSaleStatus(
  currentStatus: SaleStatus,
  subtotal: MoneyAmount,
  refundAmount: MoneyAmount,
) {
  if (currentStatus === SaleStatus.Cancelled || refundAmount === 0) {
    return currentStatus
  }

  return refundAmount >= subtotal ? SaleStatus.Refunded : SaleStatus.PartiallyRefunded
}

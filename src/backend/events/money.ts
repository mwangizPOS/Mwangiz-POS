import type { SaleItemProjection } from './projectionTypes'
import type { MoneyAmount } from '@/types/primitives'

export function roundMoney(value: number): MoneyAmount {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function getSaleItemGross(item: SaleItemProjection): MoneyAmount {
  return roundMoney(item.price * item.quantity)
}

export function getSaleItemNet(item: SaleItemProjection): MoneyAmount {
  return roundMoney(Math.max(0, getSaleItemGross(item) - item.refundedAmount))
}

export function applySaleItemRevenue(item: SaleItemProjection): SaleItemProjection {
  const netAmount = getSaleItemNet(item)
  const workerRevenue = roundMoney(netAmount * (item.commissionRateSnapshot / 100))

  return {
    ...item,
    workerRevenue,
    salonRevenue: roundMoney(netAmount - workerRevenue),
  }
}

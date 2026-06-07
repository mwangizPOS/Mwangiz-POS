import { SaleItemStatus } from '@/domain/enums'
import { EventType, type AppEvent } from '@/events'
import type { ProjectionReducerContext } from '../types'
import {
  calculateCommissionAmount,
  calculateGrossAmount,
  getSaleBranchId,
  getRefundAwareItemStatus,
  recalculateBranchRevenue,
  recalculateSaleProjectionTotals,
  recalculateWorkerEarnings,
  roundMoney,
} from './helpers'

interface SaleItemProjectionRow {
  sale_id: string
  worker_id: string
  client_id: string | null
  quantity: number
  unit_price: string
  commission_rate_snapshot: string
  amount: string
  refunded_amount: string
}

export async function reduceSaleItemProjectionEvent(
  event: AppEvent,
  context: ProjectionReducerContext,
) {
  switch (event.event_type) {
    case EventType.SaleItemAdded:
      await projectSaleItemAdded(event, context)
      return true
    case EventType.SaleItemUpdated:
      await projectSaleItemUpdated(event, context)
      return true
    case EventType.SaleItemRemoved:
      await projectSaleItemRemoved(event, context)
      return true
    default:
      return false
  }
}

async function projectSaleItemAdded(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleItemAdded }>,
  context: ProjectionReducerContext,
) {
  const amount = calculateGrossAmount(event.payload.price, event.payload.quantity)
  const commissionAmount = calculateCommissionAmount(
    amount,
    event.payload.commissionRateSnapshot,
  )

  await context.client.query(
    `
      insert into sale_items_projection (
        sale_item_id,
        sale_id,
        worker_id,
        service_id,
        client_id,
        amount,
        commission_amount,
        quantity,
        unit_price,
        commission_rate_snapshot,
        refunded_amount,
        status,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12, $12)
      on conflict (sale_item_id)
      do update set
        sale_id = excluded.sale_id,
        worker_id = excluded.worker_id,
        service_id = excluded.service_id,
        client_id = excluded.client_id,
        amount = excluded.amount,
        commission_amount = excluded.commission_amount,
        quantity = excluded.quantity,
        unit_price = excluded.unit_price,
        commission_rate_snapshot = excluded.commission_rate_snapshot,
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
    [
      event.payload.saleItemId,
      event.payload.saleId,
      event.payload.workerId,
      event.payload.serviceId,
      event.payload.saleClientId ?? null,
      amount,
      commissionAmount,
      event.payload.quantity,
      event.payload.price,
      event.payload.commissionRateSnapshot,
      event.payload.status,
      event.timestamp,
    ],
  )

  await refreshAffectedRollups(context, event.payload.saleId, [event.payload.workerId], event.timestamp)
}

async function projectSaleItemUpdated(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleItemUpdated }>,
  context: ProjectionReducerContext,
) {
  const existing = await getSaleItem(context, event.payload.saleItemId)
  if (!existing) {
    return
  }

  const quantity = event.payload.quantity ?? existing.quantity
  const unitPrice = event.payload.price ?? Number(existing.unit_price)
  const commissionRateSnapshot =
    event.payload.commissionRateSnapshot ?? Number(existing.commission_rate_snapshot)
  const refundedAmount = Number(existing.refunded_amount)
  const grossAmount = calculateGrossAmount(unitPrice, quantity)
  const amount = roundMoney(Math.max(0, grossAmount - refundedAmount))
  const commissionAmount = calculateCommissionAmount(amount, commissionRateSnapshot)
  const nextWorkerId = event.payload.workerId ?? existing.worker_id
  const nextClientId = event.payload.saleClientId ?? existing.client_id
  const status = event.payload.status ?? getRefundAwareItemStatus(amount, refundedAmount)

  await context.client.query(
    `
      update sale_items_projection
      set worker_id = $2,
          service_id = coalesce($3, service_id),
          client_id = $4,
          quantity = $5,
          unit_price = $6,
          commission_rate_snapshot = $7,
          amount = $8,
          commission_amount = $9,
          status = $10,
          updated_at = $11
      where sale_item_id = $1
    `,
    [
      event.payload.saleItemId,
      nextWorkerId,
      event.payload.serviceId ?? null,
      nextClientId,
      quantity,
      unitPrice,
      commissionRateSnapshot,
      amount,
      commissionAmount,
      status,
      event.timestamp,
    ],
  )

  await refreshAffectedRollups(
    context,
    event.payload.saleId,
    [existing.worker_id, nextWorkerId],
    event.timestamp,
  )
}

async function projectSaleItemRemoved(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleItemRemoved }>,
  context: ProjectionReducerContext,
) {
  const existing = await getSaleItem(context, event.payload.saleItemId)
  if (!existing) {
    return
  }

  await context.client.query(
    `
      update sale_items_projection
      set amount = 0,
          commission_amount = 0,
          status = $2,
          updated_at = $3
      where sale_item_id = $1
    `,
    [event.payload.saleItemId, SaleItemStatus.Removed, event.timestamp],
  )

  await refreshAffectedRollups(
    context,
    event.payload.saleId,
    [existing.worker_id],
    event.timestamp,
  )
}

async function getSaleItem(context: ProjectionReducerContext, saleItemId: string) {
  const result = await context.client.query<SaleItemProjectionRow>(
    `
      select
        sale_id,
        worker_id,
        client_id,
        quantity,
        unit_price,
        commission_rate_snapshot,
        amount,
        refunded_amount
      from sale_items_projection
      where sale_item_id = $1
    `,
    [saleItemId],
  )

  return result.rows[0]
}

async function refreshAffectedRollups(
  context: ProjectionReducerContext,
  saleId: string,
  workerIds: string[],
  updatedAt: string,
) {
  await recalculateSaleProjectionTotals(context.client, saleId, updatedAt)

  for (const workerId of new Set(workerIds)) {
    await recalculateWorkerEarnings(context.client, workerId, updatedAt)
  }

  const branchId = await getSaleBranchId(context.client, saleId)
  if (branchId) {
    await recalculateBranchRevenue(context.client, branchId, updatedAt)
  }
}

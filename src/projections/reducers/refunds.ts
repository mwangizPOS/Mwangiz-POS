import { RefundStatus, RefundTarget } from '@/domain/enums'
import { EventType, type AppEvent } from '@/events'
import type { ProjectionReducerContext } from '../types'
import {
  calculateCommissionAmount,
  getRefundAwareItemStatus,
  getSaleBranchId,
  getSaleIdForItem,
  recalculateBranchRevenue,
  recalculateSaleProjectionTotals,
  recalculateWorkerEarnings,
  roundMoney,
} from './helpers'

interface RefundProjectionRow {
  refund_id: string
  sale_id: string
  sale_item_id: string | null
  amount: string
  type: 'global' | 'item'
  status: RefundStatus
}

interface RefundableSaleItemRow {
  sale_item_id: string
  worker_id: string
  amount: string
  refunded_amount: string
  unit_price: string
  quantity: number
  commission_rate_snapshot: string
}

export async function reduceRefundProjectionEvent(
  event: AppEvent,
  context: ProjectionReducerContext,
) {
  switch (event.event_type) {
    case EventType.RefundRequested:
      await projectRefundRequested(event, context)
      return true
    case EventType.RefundApproved:
      await projectRefundApproved(event, context)
      return true
    case EventType.RefundRejected:
      await projectRefundRejected(event, context)
      return true
    case EventType.RefundProcessed:
      await projectRefundProcessed(event, context)
      return true
    default:
      return false
  }
}

async function projectRefundRequested(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundRequested }>,
  context: ProjectionReducerContext,
) {
  const saleId =
    event.payload.saleId ??
    (event.payload.saleItemId ? await getSaleIdForItem(context.client, event.payload.saleItemId) : null)

  if (!saleId) {
    return
  }

  const refundType = event.payload.refundTarget === RefundTarget.Sale ? 'global' : 'item'

  await context.client.query(
    `
      insert into refund_projection (
        refund_id,
        sale_id,
        sale_item_id,
        amount,
        type,
        status,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $7)
      on conflict (refund_id)
      do update set
        sale_id = excluded.sale_id,
        sale_item_id = excluded.sale_item_id,
        amount = excluded.amount,
        type = excluded.type,
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
    [
      event.payload.refundId,
      saleId,
      event.payload.saleItemId ?? null,
      event.payload.amount,
      refundType,
      event.payload.status,
      event.timestamp,
    ],
  )
}

async function projectRefundApproved(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundApproved }>,
  context: ProjectionReducerContext,
) {
  await updateRefundStatus(
    context,
    event.payload.refundId,
    event.payload.status,
    event.payload.approvedAt,
  )
}

async function projectRefundRejected(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundRejected }>,
  context: ProjectionReducerContext,
) {
  await updateRefundStatus(
    context,
    event.payload.refundId,
    event.payload.status,
    event.payload.rejectedAt,
  )
}

async function projectRefundProcessed(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundProcessed }>,
  context: ProjectionReducerContext,
) {
  const refund = await getRefund(context, event.payload.refundId)
  if (!refund) {
    return
  }

  await context.client.query(
    `
      update refund_projection
      set amount = $2,
          status = $3,
          updated_at = $4
      where refund_id = $1
    `,
    [
      event.payload.refundId,
      event.payload.processedAmount,
      event.payload.status,
      event.payload.processedAt,
    ],
  )

  const touchedWorkerIds =
    refund.type === 'item' && refund.sale_item_id
      ? await applyItemRefund(
          context,
          refund.sale_item_id,
          event.payload.processedAmount,
          event.payload.processedAt,
        )
      : await applyGlobalRefund(
          context,
          refund.sale_id,
          event.payload.processedAmount,
          event.payload.processedAt,
        )

  await recalculateSaleProjectionTotals(context.client, refund.sale_id, event.timestamp)

  for (const workerId of touchedWorkerIds) {
    await recalculateWorkerEarnings(context.client, workerId, event.timestamp)
  }

  const branchId = await getSaleBranchId(context.client, refund.sale_id)
  if (branchId) {
    await recalculateBranchRevenue(context.client, branchId, event.timestamp)
  }
}

async function applyItemRefund(
  context: ProjectionReducerContext,
  saleItemId: string,
  refundAmount: number,
  updatedAt: string,
) {
  const item = await getRefundableSaleItem(context, saleItemId)
  if (!item) {
    return []
  }

  await applyRefundToItem(context, item, refundAmount, updatedAt)
  return [item.worker_id]
}

async function applyGlobalRefund(
  context: ProjectionReducerContext,
  saleId: string,
  refundAmount: number,
  updatedAt: string,
) {
  const result = await context.client.query<RefundableSaleItemRow>(
    `
      select
        sale_item_id,
        worker_id,
        amount,
        refunded_amount,
        unit_price,
        quantity,
        commission_rate_snapshot
      from sale_items_projection
      where sale_id = $1
        and status <> 'Removed'
        and amount > 0
      order by created_at asc, sale_item_id asc
    `,
    [saleId],
  )
  let remaining = refundAmount
  const workerIds = new Set<string>()

  for (const item of result.rows) {
    if (remaining <= 0) {
      break
    }

    const itemAmount = Number(item.amount)
    const itemRefund = Math.min(itemAmount, remaining)

    if (itemRefund > 0) {
      await applyRefundToItem(context, item, itemRefund, updatedAt)
      workerIds.add(item.worker_id)
      remaining = roundMoney(remaining - itemRefund)
    }
  }

  return [...workerIds]
}

async function applyRefundToItem(
  context: ProjectionReducerContext,
  item: RefundableSaleItemRow,
  refundAmount: number,
  updatedAt: string,
) {
  const amount = roundMoney(Math.max(0, Number(item.amount) - refundAmount))
  const refundedAmount = roundMoney(Number(item.refunded_amount) + refundAmount)
  const commissionRateSnapshot = Number(item.commission_rate_snapshot)
  const commissionAmount = calculateCommissionAmount(amount, commissionRateSnapshot)
  const status = getRefundAwareItemStatus(amount, refundedAmount)

  await context.client.query(
    `
      update sale_items_projection
      set amount = $2,
          refunded_amount = $3,
          commission_amount = $4,
          status = $5,
          updated_at = $6
      where sale_item_id = $1
    `,
    [item.sale_item_id, amount, refundedAmount, commissionAmount, status, updatedAt],
  )
}

async function getRefundableSaleItem(
  context: ProjectionReducerContext,
  saleItemId: string,
) {
  const result = await context.client.query<RefundableSaleItemRow>(
    `
      select
        sale_item_id,
        worker_id,
        amount,
        refunded_amount,
        unit_price,
        quantity,
        commission_rate_snapshot
      from sale_items_projection
      where sale_item_id = $1
    `,
    [saleItemId],
  )

  return result.rows[0]
}

async function getRefund(context: ProjectionReducerContext, refundId: string) {
  const result = await context.client.query<RefundProjectionRow>(
    `
      select
        refund_id,
        sale_id,
        sale_item_id,
        amount,
        type,
        status
      from refund_projection
      where refund_id = $1
    `,
    [refundId],
  )

  return result.rows[0]
}

async function updateRefundStatus(
  context: ProjectionReducerContext,
  refundId: string,
  status: RefundStatus,
  updatedAt: string,
) {
  await context.client.query(
    `
      update refund_projection
      set status = $2,
          updated_at = $3
      where refund_id = $1
    `,
    [refundId, status, updatedAt],
  )
}

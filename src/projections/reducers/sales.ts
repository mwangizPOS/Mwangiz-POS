import { SaleStatus } from '@/domain/enums'
import { EventType, type AppEvent } from '@/events'
import type { ProjectionReducerContext } from '../types'
import {
  getSaleBranchId,
  recalculateBranchRevenue,
  recalculateSaleProjectionTotals,
} from './helpers'

export async function reduceSaleProjectionEvent(
  event: AppEvent,
  context: ProjectionReducerContext,
) {
  switch (event.event_type) {
    case EventType.SaleCreated:
      await projectSaleCreated(event, context)
      return true
    case EventType.SaleCompleted:
      await projectSaleCompleted(event, context)
      return true
    case EventType.SaleCancelled:
      await projectSaleCancelled(event, context)
      return true
    case EventType.PaymentCompleted:
      await projectPaymentCompleted(event, context)
      return true
    default:
      return false
  }
}

async function projectSaleCreated(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleCreated }>,
  context: ProjectionReducerContext,
) {
  await context.client.query(
    `
      insert into sales_projection (
        sale_id,
        branch_id,
        total_amount,
        status,
        created_at,
        updated_at
      )
      values ($1, $2, 0, $3, $4, $4)
      on conflict (sale_id)
      do update set
        branch_id = excluded.branch_id,
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
    [event.payload.saleId, event.payload.branchId, event.payload.status, event.timestamp],
  )

  await recalculateBranchRevenue(context.client, event.payload.branchId, event.timestamp)
}

async function projectSaleCompleted(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleCompleted }>,
  context: ProjectionReducerContext,
) {
  await context.client.query(
    `
      update sales_projection
      set status = $2,
          total_amount = $3,
          updated_at = $4
      where sale_id = $1
    `,
    [event.payload.saleId, event.payload.status, event.payload.totalAmount, event.timestamp],
  )

  const branchId = await getSaleBranchId(context.client, event.payload.saleId)
  if (branchId) {
    await recalculateBranchRevenue(context.client, branchId, event.timestamp)
  }
}

async function projectSaleCancelled(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleCancelled }>,
  context: ProjectionReducerContext,
) {
  await context.client.query(
    `
      update sales_projection
      set status = $2,
          updated_at = $3
      where sale_id = $1
    `,
    [event.payload.saleId, SaleStatus.Cancelled, event.timestamp],
  )

  const branchId = await getSaleBranchId(context.client, event.payload.saleId)
  if (branchId) {
    await recalculateBranchRevenue(context.client, branchId, event.timestamp)
  }
}

async function projectPaymentCompleted(
  event: Extract<AppEvent, { event_type: typeof EventType.PaymentCompleted }>,
  context: ProjectionReducerContext,
) {
  await recalculateSaleProjectionTotals(context.client, event.payload.saleId, event.timestamp)
  await context.client.query(
    `
      update sales_projection
      set status = $2,
          total_amount = $3,
          updated_at = $4
      where sale_id = $1
    `,
    [event.payload.saleId, SaleStatus.Completed, event.payload.amount, event.timestamp],
  )

  const branchId = await getSaleBranchId(context.client, event.payload.saleId)
  if (branchId) {
    await recalculateBranchRevenue(context.client, branchId, event.timestamp)
  }
}

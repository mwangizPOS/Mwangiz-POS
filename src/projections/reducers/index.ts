import { EventType, type AppEvent } from '@/events'
import type { ProjectionReducerContext } from '../types'
import { reduceAuditProjectionEvent } from './audit'
import { reduceRefundProjectionEvent } from './refunds'
import { reduceSaleItemProjectionEvent } from './saleItems'
import { reduceSaleProjectionEvent } from './sales'
import { reduceSettlementProjectionEvent } from './settlements'

export async function reduceProjectionEvent(
  event: AppEvent,
  context: ProjectionReducerContext,
) {
  if (await reduceSaleProjectionEvent(event, context)) {
    return
  }

  if (await reduceSaleItemProjectionEvent(event, context)) {
    return
  }

  if (await reduceRefundProjectionEvent(event, context)) {
    return
  }

  if (await reduceSettlementProjectionEvent(event, context)) {
    return
  }

  if (await reduceAuditProjectionEvent(event, context)) {
    return
  }

  if (
    event.event_type === EventType.PaymentInitiated ||
    event.event_type === EventType.SplitPaymentRecorded
  ) {
    return
  }
}

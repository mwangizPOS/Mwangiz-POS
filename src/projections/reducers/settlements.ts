import { EventType, type AppEvent } from '@/events'
import type { ProjectionReducerContext } from '../types'
import {
  incrementWorkerPaidEarnings,
  markWorkerEarningsPaid,
  recalculateWorkerEarnings,
} from './helpers'

export async function reduceSettlementProjectionEvent(
  event: AppEvent,
  context: ProjectionReducerContext,
) {
  switch (event.event_type) {
    case EventType.WorkerSettlementCalculated:
      await recalculateWorkerEarnings(context.client, event.payload.workerId, event.timestamp)
      return true
    case EventType.WorkerPaid:
      await incrementWorkerPaidEarnings(
        context.client,
        event.payload.workerId,
        event.payload.amount,
        event.payload.paidAt,
      )
      return true
    case EventType.WorkerSettlementMarkedPaid:
      await markWorkerEarningsPaid(context.client, event.payload.workerId, event.payload.paidAt)
      return true
    default:
      return false
  }
}

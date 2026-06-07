import type { SettlementRecalculationTrigger } from './projectionTypes'
import { EventType } from '@/events'
import type { EntityId } from '@/types/primitives'

export function createSettlementTrigger(
  workerId: EntityId,
  branchId: EntityId,
  reason:
    | typeof EventType.SaleItemAdded
    | typeof EventType.SaleItemUpdated
    | typeof EventType.SaleItemRemoved
    | typeof EventType.RefundProcessed,
): SettlementRecalculationTrigger {
  return {
    workerId,
    branchId,
    reason,
  }
}

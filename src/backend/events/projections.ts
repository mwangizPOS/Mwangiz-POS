import type { ProjectionStore } from './store'
import type { ProjectionUpdateSummary } from './projectionTypes'
import type { EntityId } from '@/types/primitives'

export function createProjectionUpdateSummary(): ProjectionUpdateSummary {
  return {
    sales: [],
    saleItems: [],
    refunds: [],
    settlements: [],
    auditLogs: [],
  }
}

export function pushUnique(target: EntityId[], value: EntityId) {
  if (!target.includes(value)) {
    target.push(value)
  }
}

export async function loadProjectionViews(store: ProjectionStore, branchId: EntityId) {
  void store

  return {
    salesSummaryView: {
      branchId,
    },
    workerEarningsView: {
      branchId,
    },
    branchRevenueView: {
      branchId,
    },
    refundTrackingView: {
      branchId,
    },
    auditLogView: {
      branchId,
    },
  }
}

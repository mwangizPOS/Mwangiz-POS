import type { AppEvent, EventEnvelope } from '../events/index.js'
import type { DateTimeString, EntityId, JsonObject } from '../types/primitives.js'

export const SyncEventStatus = {
  Pending: 'Pending',
  Synced: 'Synced',
  Failed: 'Failed',
} as const

export type SyncEventStatus =
  (typeof SyncEventStatus)[keyof typeof SyncEventStatus]

export const syncEventStatusValues = [
  SyncEventStatus.Pending,
  SyncEventStatus.Synced,
  SyncEventStatus.Failed,
] as const

export interface SyncEvent {
  local_id: EntityId
  event_envelope: AppEvent
  status: SyncEventStatus
  retry_count: number
}

export interface SyncQueueRequest {
  branchId: EntityId
  deviceId: EntityId
  events: SyncEvent[]
}

export interface SyncEventResult {
  localId: EntityId
  eventId: EntityId
  idempotencyKey: string
  status: SyncEventStatus
  message?: string
  metadata?: JsonObject
}

export interface SyncQueueResponse {
  branchId: EntityId
  deviceId: EntityId
  accepted: SyncEventResult[]
  rejected: SyncEventResult[]
  syncedAt: DateTimeString
}

export interface SyncEventBatchRequest {
  batchId: EntityId
  branchId: EntityId
  deviceId: EntityId
  events: EventEnvelope[]
}

export interface SyncEventBatchResponse {
  batchId: EntityId
  accepted: SyncEventResult[]
  duplicates: SyncEventResult[]
  rejected: SyncEventResult[]
  processedAt: DateTimeString
}

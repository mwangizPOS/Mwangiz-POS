import type { AppEvent } from '@/events'
import type { EntityId } from '@/types/primitives'

export const SyncStatus = {
  Pending: 'Pending',
  Syncing: 'Syncing',
  Synced: 'Synced',
  Failed: 'Failed',
} as const

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus]

export const NetworkQuality = {
  Online: 'Online',
  Offline: 'Offline',
  Unstable: 'Unstable',
} as const

export type NetworkQuality = (typeof NetworkQuality)[keyof typeof NetworkQuality]

export interface RetryState {
  retryCount: number
  nextRetryAt: string | null
  lastAttemptAt: string | null
  lastError: string | null
}

export interface OutboxEvent {
  localId: EntityId
  eventId: EntityId
  aggregateId: EntityId
  aggregateType: string
  eventType: string
  branchId: EntityId
  idempotencyKey: string
  event: AppEvent
  status: SyncStatus
  retryState: RetryState
  createdAt: string
  updatedAt: string
  syncedAt: string | null
  sequence: number
}

export interface NetworkState {
  quality: NetworkQuality
  online: boolean
  unstable: boolean
  checkedAt: string
  since: string
  latencyMs?: number
  reason?: string
}

export interface SyncBatchResultItem {
  eventId: EntityId
  idempotencyKey: string
  status: 'processed' | 'duplicate' | 'rejected' | 'synced' | 'failed'
  message?: string
}

export interface SyncBatchResult {
  accepted: SyncBatchResultItem[]
  duplicates: SyncBatchResultItem[]
  rejected: SyncBatchResultItem[]
  processedAt: string
}

export interface SyncTransport {
  sendBatch: (events: AppEvent[]) => Promise<SyncBatchResult>
}

export interface QueueProcessorOptions {
  batchSize?: number
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

export interface QueueProcessResult {
  attempted: number
  synced: number
  failed: number
  skipped: number
  processedAt: string
}

export interface NetworkSubscription {
  unsubscribe: () => void
}

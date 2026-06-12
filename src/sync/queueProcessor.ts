import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import type { OutboxEvent, QueueProcessResult, QueueProcessorOptions, SyncBatchResult, SyncTransport } from './types.js'
import { isOnline } from './networkDetector.js'
import { createOutboxStore, type OutboxStore } from './outbox/outboxStore.js'

interface BackendSyncRetryResponse {
  data?: {
    accepted?: BackendSyncResultItem[]
    duplicates?: BackendSyncResultItem[]
    rejected?: BackendSyncResultItem[]
    processedAt?: string
  }
}

interface BackendSyncResultItem {
  eventId: string
  idempotencyKey: string
  status: string
  message?: string
}

const DEFAULT_BATCH_SIZE = 50
const DEFAULT_MAX_RETRIES = 8
const DEFAULT_BASE_DELAY_MS = 1_000
const DEFAULT_MAX_DELAY_MS = 5 * 60_000

export class QueueProcessor {
  private readonly store: OutboxStore
  private readonly transport: SyncTransport
  private readonly options: Required<QueueProcessorOptions>
  private running = false

  constructor(store: OutboxStore, transport: SyncTransport, options: QueueProcessorOptions = {}) {
    this.store = store
    this.transport = transport
    this.options = {
      batchSize: options.batchSize ?? DEFAULT_BATCH_SIZE,
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      baseDelayMs: options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS,
      maxDelayMs: options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
    }
  }

  async processQueue(): Promise<QueueProcessResult> {
    if (this.running) {
      return createEmptyResult()
    }

    this.running = true
    let events: OutboxEvent[] = []

    try {
      if (!(await isOnline())) {
        return createEmptyResult()
      }

      this.store.resetSyncingEvents()
      events = this.store.getPendingEvents({ limit: this.options.batchSize })

      if (events.length === 0) {
        return createEmptyResult()
      }

      for (const event of events) {
        this.store.markEventSyncing(event.eventId)
      }

      const response = await this.transport.sendBatch(events.map((event) => event.event))
      return this.applyBatchResult(events, response)
    } catch (error) {
      for (const event of events) {
        this.failEvent(event, error)
      }

      return {
        attempted: events.length,
        synced: 0,
        failed: events.length,
        skipped: 0,
        processedAt: new Date().toISOString(),
      }
    } finally {
      this.running = false
    }
  }

  async retryFailedEvents(): Promise<QueueProcessResult> {
    return this.processQueue()
  }

  async flushOnReconnect(): Promise<QueueProcessResult> {
    if (!(await isOnline())) {
      return createEmptyResult()
    }

    return this.processQueue()
  }

  private applyBatchResult(events: OutboxEvent[], response: SyncBatchResult): QueueProcessResult {
    const accepted = new Set([
      ...response.accepted.map((item) => item.eventId),
      ...response.duplicates.map((item) => item.eventId),
    ])
    const rejected = new Map(response.rejected.map((item) => [item.eventId, item.message]))
    let synced = 0
    let failed = 0

    for (const event of events) {
      if (accepted.has(event.eventId)) {
        this.store.markEventSynced(event.eventId)
        synced += 1
        continue
      }

      const rejectedMessage = rejected.get(event.eventId)
      this.failEvent(event, rejectedMessage ?? 'Backend rejected or omitted the event.')
      failed += 1
    }

    return {
      attempted: events.length,
      synced,
      failed,
      skipped: 0,
      processedAt: response.processedAt,
    }
  }

  private failEvent(event: OutboxEvent, error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    const retryCount = event.retryState.retryCount + 1
    const delayMs = calculateBackoffDelayMs(retryCount, this.options)
    const nextRetryAt =
      retryCount > this.options.maxRetries
        ? new Date(Date.now() + this.options.maxDelayMs).toISOString()
        : new Date(Date.now() + delayMs).toISOString()

    this.store.markEventFailed(event.eventId, nextRetryAt, message)
  }
}

export function createBackendSyncTransport(options: { baseUrl?: string; apiKey?: string } = {}): SyncTransport {
  const baseUrl =
    options.baseUrl ??
    process.env.VITE_API_BASE_URL ??
    process.env.MWANGI_POS_API_BASE_URL ??
    'http://localhost:4000'
  const apiKey = options.apiKey ?? process.env.BACKEND_API_KEY

  return {
    async sendBatch(events) {
      const branchId = events[0]?.branch_id ?? 'unknown'
      const response = await axios.post<BackendSyncRetryResponse>(
        `${baseUrl.replace(/\/$/, '')}/api/sync/retry`,
        {
          batchId: uuidv4(),
          branchId,
          deviceId: getDeviceId(),
          events,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-api-key': apiKey } : {}),
          },
          timeout: 30_000,
        },
      )

      return {
        accepted: normalizeItems(response.data.data?.accepted),
        duplicates: normalizeItems(response.data.data?.duplicates),
        rejected: normalizeItems(response.data.data?.rejected),
        processedAt: response.data.data?.processedAt ?? new Date().toISOString(),
      }
    },
  }
}

export const defaultOutboxStore = createOutboxStore()
export const defaultQueueProcessor = new QueueProcessor(
  defaultOutboxStore,
  createBackendSyncTransport(),
)

export function processQueue() {
  return defaultQueueProcessor.processQueue()
}

export function retryFailedEvents() {
  return defaultQueueProcessor.retryFailedEvents()
}

export function flushOnReconnect() {
  return defaultQueueProcessor.flushOnReconnect()
}

function calculateBackoffDelayMs(
  retryCount: number,
  options: Required<QueueProcessorOptions>,
) {
  const exponentialDelay = options.baseDelayMs * 2 ** Math.max(0, retryCount - 1)
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs)
  const jitter = Math.floor(Math.random() * Math.min(1_000, cappedDelay))

  return cappedDelay + jitter
}

function normalizeItems(items: BackendSyncResultItem[] | undefined) {
  return (items ?? []).map((item) => ({
    eventId: item.eventId,
    idempotencyKey: item.idempotencyKey,
    status: item.status as 'processed' | 'duplicate' | 'rejected',
    message: item.message,
  }))
}

function createEmptyResult(): QueueProcessResult {
  return {
    attempted: 0,
    synced: 0,
    failed: 0,
    skipped: 0,
    processedAt: new Date().toISOString(),
  }
}

function getDeviceId() {
  return process.env.MWANGI_POS_DEVICE_ID ?? 'electron-pos'
}

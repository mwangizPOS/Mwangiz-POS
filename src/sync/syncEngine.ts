import { validateIncomingEvent } from '@/backend/events/validation'
import type { AppEvent } from '@/events'
import { withDeterministicIdempotencyKey } from './idempotency'
import { createNetworkDetector, type NetworkChangeCallback, type NetworkDetectorOptions } from './networkDetector'
import { QueueProcessor, createBackendSyncTransport } from './queueProcessor'
import { createOutboxStore, type OutboxStore, type OutboxStoreOptions } from './outbox/outboxStore'
import type { NetworkSubscription, QueueProcessResult, QueueProcessorOptions, SyncTransport } from './types'

export interface SyncEngineOptions {
  outbox?: OutboxStore
  outboxOptions?: OutboxStoreOptions
  transport?: SyncTransport
  backendBaseUrl?: string
  apiKey?: string
  queue?: QueueProcessorOptions
  network?: NetworkDetectorOptions
  autoFlushOnReconnect?: boolean
}

export class SyncEngine {
  private readonly outbox: OutboxStore
  private readonly processor: QueueProcessor
  private readonly networkDetector: ReturnType<typeof createNetworkDetector>
  private readonly autoFlushOnReconnect: boolean
  private subscription?: NetworkSubscription

  constructor(options: SyncEngineOptions = {}) {
    this.outbox = options.outbox ?? createOutboxStore(options.outboxOptions)
    const transport =
      options.transport ??
      createBackendSyncTransport({
        baseUrl: options.backendBaseUrl,
        apiKey: options.apiKey,
      })

    this.processor = new QueueProcessor(this.outbox, transport, options.queue)
    this.networkDetector = createNetworkDetector(options.network)
    this.autoFlushOnReconnect = options.autoFlushOnReconnect ?? true
  }

  start(): void {
    if (this.subscription) {
      return
    }

    this.subscription = this.networkDetector.subscribeToNetworkChanges((state) => {
      if (this.autoFlushOnReconnect && state.online) {
        void this.flushOnReconnect()
      }
    })
  }

  stop(): void {
    this.subscription?.unsubscribe()
    this.subscription = undefined
  }

  async captureEvent(input: AppEvent) {
    const event = validateIncomingEvent(withDeterministicIdempotencyKey(input))
    const outboxEvent = this.outbox.appendEvent(event)

    if (await this.networkDetector.isOnline()) {
      void this.processor.processQueue()
    }

    return outboxEvent
  }

  async processQueue(): Promise<QueueProcessResult> {
    return this.processor.processQueue()
  }

  async retryFailedEvents(): Promise<QueueProcessResult> {
    return this.processor.retryFailedEvents()
  }

  async flushOnReconnect(): Promise<QueueProcessResult> {
    return this.processor.flushOnReconnect()
  }

  subscribeToNetworkChanges(callback: NetworkChangeCallback): NetworkSubscription {
    return this.networkDetector.subscribeToNetworkChanges(callback)
  }

  clearSyncedEvents(): number {
    return this.outbox.clearSyncedEvents()
  }

  close(): void {
    this.stop()
    this.outbox.close()
  }
}

export function createSyncEngine(options: SyncEngineOptions = {}) {
  return new SyncEngine(options)
}

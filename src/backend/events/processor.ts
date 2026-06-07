import { emitAuditLog } from './audit'
import { EventProcessingError, EventProcessingErrorCode } from './errors'
import type { IdempotencyStore, ProcessedEventRecord } from './idempotency'
import { InMemoryIdempotencyStore } from './idempotency'
import type { ProjectionUpdateSummary, SettlementRecalculationTrigger } from './projectionTypes'
import { createProjectionUpdateSummary, pushUnique } from './projections'
import { routeEvent } from './router'
import type { ProjectionStore } from './store'
import { InMemoryProjectionStore } from './store'
import { validateIncomingEvent } from './validation'
import type { AppEvent } from '@/events'

export type EventProcessingStatus = 'processed' | 'duplicate' | 'rejected'

export interface ProcessedEventResult {
  status: 'processed'
  event: AppEvent
  projectionUpdates: ProjectionUpdateSummary
  settlementTriggers: SettlementRecalculationTrigger[]
}

export interface DuplicateEventResult {
  status: 'duplicate'
  event: AppEvent
  processedEvent: ProcessedEventRecord
  projectionUpdates: ProjectionUpdateSummary
  settlementTriggers: SettlementRecalculationTrigger[]
}

export interface RejectedEventResult {
  status: 'rejected'
  error: {
    code: EventProcessingErrorCode
    message: string
  }
}

export type EventProcessingResult =
  | ProcessedEventResult
  | DuplicateEventResult
  | RejectedEventResult

export interface EventProcessorDependencies {
  store: ProjectionStore
  idempotencyStore: IdempotencyStore
  now: () => string
}

export class EventProcessor {
  private readonly store: ProjectionStore
  private readonly idempotencyStore: IdempotencyStore
  private readonly now: () => string

  constructor(dependencies?: Partial<EventProcessorDependencies>) {
    this.store = dependencies?.store ?? new InMemoryProjectionStore()
    this.idempotencyStore = dependencies?.idempotencyStore ?? new InMemoryIdempotencyStore()
    this.now = dependencies?.now ?? (() => new Date().toISOString())
  }

  async process(input: unknown): Promise<EventProcessingResult> {
    let event: AppEvent

    try {
      event = validateIncomingEvent(input)
    } catch (error) {
      return reject(EventProcessingErrorCode.ValidationFailed, getErrorMessage(error))
    }

    const processedEvent = await this.idempotencyStore.findProcessed(event)

    if (processedEvent) {
      return {
        status: 'duplicate',
        event,
        processedEvent,
        projectionUpdates: createProjectionUpdateSummary(),
        settlementTriggers: [],
      }
    }

    try {
      const reducerResult = await routeEvent(event, this.store)
      const auditLog = await emitAuditLog(this.store, event)

      if (auditLog) {
        pushUnique(reducerResult.projectionUpdates.auditLogs, auditLog.id)
      }

      await this.store.appendEvent(event)
      await this.idempotencyStore.markProcessed(event, this.now())

      return {
        status: 'processed',
        event,
        projectionUpdates: reducerResult.projectionUpdates,
        settlementTriggers: reducerResult.settlementTriggers,
      }
    } catch (error) {
      if (error instanceof EventProcessingError) {
        return reject(error.code, error.message)
      }

      return reject(EventProcessingErrorCode.InvariantViolation, getErrorMessage(error))
    }
  }
}

function reject(code: EventProcessingErrorCode, message: string): RejectedEventResult {
  return {
    status: 'rejected',
    error: {
      code,
      message,
    },
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown event processing error.'
}

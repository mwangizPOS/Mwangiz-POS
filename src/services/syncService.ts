import type { SyncRetryResponse } from '@/types/api'
import { eventStoreService, type EventStoreService } from './eventStoreService'
import { validateIncomingEvent } from '@/backend/events/validation'

export interface SyncRetryRequest {
  batchId: string
  events: unknown[]
}

export class SyncService {
  private readonly events: EventStoreService

  constructor(events: EventStoreService) {
    this.events = events
  }

  async retry(request: SyncRetryRequest): Promise<SyncRetryResponse> {
    const response: SyncRetryResponse = {
      batchId: request.batchId,
      accepted: [],
      duplicates: [],
      rejected: [],
      processedAt: new Date().toISOString(),
    }

    for (const input of request.events) {
      try {
        const event = validateIncomingEvent(input)
        const result = await this.events.ingest(event)
        const item = {
          eventId: result.eventId,
          idempotencyKey: result.idempotencyKey,
          status: result.status,
          message:
            result.processorResult?.status === 'rejected'
              ? result.processorResult.error.message
              : undefined,
        }

        if (result.status === 'duplicate') {
          response.duplicates.push(item)
        } else if (result.status === 'rejected') {
          response.rejected.push(item)
        } else {
          response.accepted.push(item)
        }
      } catch (error) {
        response.rejected.push({
          eventId: 'unknown',
          idempotencyKey: 'unknown',
          status: 'rejected',
          message: error instanceof Error ? error.message : 'Unknown sync error.',
        })
      }
    }

    return response
  }
}

export const syncService = new SyncService(eventStoreService)

import { EventProcessor, type EventProcessingResult } from '@/backend/events'
import { validateIncomingEvent } from '@/backend/events/validation'
import { EventStoreRepository } from '@/database/repositories'
import type { AppEvent } from '@/events'
import { processPendingProjectionEvents } from '@/projections'
import type { EventIngestionResponse, StoredEventRecord } from '@/types/api'

export class EventStoreService {
  private readonly repository: EventStoreRepository

  constructor(repository = new EventStoreRepository()) {
    this.repository = repository
  }

  async ingest(input: unknown): Promise<EventIngestionResponse> {
    const event = validateIncomingEvent(input)
    const duplicate = await this.repository.findDuplicate(event.event_id, event.idempotency_key)

    if (duplicate) {
      return {
        eventId: duplicate.event.event_id,
        idempotencyKey: duplicate.event.idempotency_key,
        status: 'duplicate',
      }
    }

    await this.repository.appendEventWithPendingIdempotency(event)

    const processorResult = await this.processEventFromStore(event)
    const status = processorResult.status === 'rejected' ? 'Rejected' : 'Processed'
    await this.repository.markIdempotencyStatus(event.idempotency_key, status)

    if (status === 'Processed') {
      await processPendingProjectionEvents()
    }

    return {
      eventId: event.event_id,
      idempotencyKey: event.idempotency_key,
      status: processorResult.status === 'rejected' ? 'rejected' : 'processed',
      processorResult,
    }
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<StoredEventRecord | undefined> {
    return this.repository.findByIdempotencyKey(idempotencyKey)
  }

  async findPaymentInitiatedByProviderRequestId(
    providerRequestId: string,
  ): Promise<StoredEventRecord | undefined> {
    return this.repository.findPaymentInitiatedByProviderRequestId(providerRequestId)
  }

  private async processEventFromStore(event: AppEvent): Promise<EventProcessingResult> {
    const processor = new EventProcessor()
    const previousEvents = await this.repository.loadProcessedAggregateEvents(event)

    for (const previousEvent of previousEvents) {
      await processor.process(previousEvent)
    }

    return processor.process(event)
  }
}

export const eventStoreService = new EventStoreService()

import type { AppEvent } from '@/events'
import type { DateTimeString, EntityId } from '@/types/primitives'

export interface ProcessedEventRecord {
  eventId: EntityId
  idempotencyKey: string
  processedAt: DateTimeString
}

export interface IdempotencyStore {
  findProcessed: (event: AppEvent) => Promise<ProcessedEventRecord | undefined>
  markProcessed: (event: AppEvent, processedAt: DateTimeString) => Promise<void>
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly byEventId = new Map<EntityId, ProcessedEventRecord>()
  private readonly byIdempotencyKey = new Map<string, ProcessedEventRecord>()

  async findProcessed(event: AppEvent) {
    return (
      this.byEventId.get(event.event_id) ??
      this.byIdempotencyKey.get(event.idempotency_key)
    )
  }

  async markProcessed(event: AppEvent, processedAt: DateTimeString) {
    const record: ProcessedEventRecord = {
      eventId: event.event_id,
      idempotencyKey: event.idempotency_key,
      processedAt,
    }

    this.byEventId.set(event.event_id, record)
    this.byIdempotencyKey.set(event.idempotency_key, record)
  }
}

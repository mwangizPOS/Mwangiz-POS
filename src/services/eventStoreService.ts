import { EventProcessor, type EventProcessingResult } from '@/backend/events'
import { query, withTransaction } from '@/config/database'
import type { AppEvent } from '@/events'
import { validateIncomingEvent } from '@/backend/events/validation'
import type { EventIngestionResponse, StoredEventRecord } from '@/types/api'

type ProcessingStatus = 'Pending' | 'Processed' | 'Rejected'

interface EventStoreRow {
  event_id: string
  event_type: string
  aggregate_id: string
  aggregate_type: string
  branch_id: string
  actor_id: string
  payload: object
  version: number
  idempotency_key: string
  occurred_at: Date | string
  processing_status?: ProcessingStatus | null
}

export class EventStoreService {
  async ingest(input: unknown): Promise<EventIngestionResponse> {
    const event = validateIncomingEvent(input)
    const duplicate = await this.findDuplicate(event.event_id, event.idempotency_key)

    if (duplicate) {
      return {
        eventId: duplicate.event.event_id,
        idempotencyKey: duplicate.event.idempotency_key,
        status: 'duplicate',
      }
    }

    await this.appendEvent(event)

    const processorResult = await this.processEventFromStore(event)
    const status = processorResult.status === 'rejected' ? 'Rejected' : 'Processed'
    await this.markIdempotencyStatus(event.idempotency_key, status)

    return {
      eventId: event.event_id,
      idempotencyKey: event.idempotency_key,
      status: processorResult.status === 'rejected' ? 'rejected' : 'processed',
      processorResult,
    }
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<StoredEventRecord | undefined> {
    const result = await query<EventStoreRow>(
      `
        select
          es.event_id,
          es.event_type,
          es.aggregate_id,
          es.aggregate_type,
          es.branch_id,
          es.actor_id,
          es.payload,
          es.version,
          es.idempotency_key,
          es.occurred_at,
          ik.status as processing_status
        from event_store es
        left join idempotency_keys ik on ik.event_id = es.event_id
        where es.idempotency_key = $1
        limit 1
      `,
      [idempotencyKey],
    )

    const row = result.rows[0]
    return row ? this.toStoredEvent(row) : undefined
  }

  async findPaymentInitiatedByProviderRequestId(
    providerRequestId: string,
  ): Promise<StoredEventRecord | undefined> {
    const result = await query<EventStoreRow>(
      `
        select
          es.event_id,
          es.event_type,
          es.aggregate_id,
          es.aggregate_type,
          es.branch_id,
          es.actor_id,
          es.payload,
          es.version,
          es.idempotency_key,
          es.occurred_at,
          ik.status as processing_status
        from event_store es
        left join idempotency_keys ik on ik.event_id = es.event_id
        where es.event_type = 'PaymentInitiated'
          and es.payload->>'providerRequestId' = $1
          and ik.status = 'Processed'
        order by es.recorded_at desc
        limit 1
      `,
      [providerRequestId],
    )

    const row = result.rows[0]
    return row ? this.toStoredEvent(row) : undefined
  }

  private async appendEvent(event: AppEvent) {
    await withTransaction(async (client) => {
      await client.query(
        `
          insert into event_store (
            event_id,
            event_type,
            aggregate_id,
            aggregate_type,
            branch_id,
            actor_id,
            payload,
            version,
            idempotency_key,
            occurred_at
          )
          values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
        `,
        [
          event.event_id,
          event.event_type,
          event.aggregate_id,
          event.aggregate_type,
          event.branch_id,
          event.actor_id,
          JSON.stringify(event.payload),
          event.version,
          event.idempotency_key,
          event.timestamp,
        ],
      )

      await client.query(
        `
          insert into idempotency_keys (
            idempotency_key,
            event_id,
            status,
            first_seen_at
          )
          values ($1, $2, 'Pending', now())
        `,
        [event.idempotency_key, event.event_id],
      )
    })
  }

  private async processEventFromStore(event: AppEvent): Promise<EventProcessingResult> {
    const processor = new EventProcessor()
    const previousEvents = await this.loadProcessedAggregateEvents(event)

    for (const previousEvent of previousEvents) {
      await processor.process(previousEvent)
    }

    return processor.process(event)
  }

  private async loadProcessedAggregateEvents(event: AppEvent) {
    const result = await query<EventStoreRow>(
      `
        select
          es.event_id,
          es.event_type,
          es.aggregate_id,
          es.aggregate_type,
          es.branch_id,
          es.actor_id,
          es.payload,
          es.version,
          es.idempotency_key,
          es.occurred_at,
          ik.status as processing_status
        from event_store es
        inner join idempotency_keys ik on ik.event_id = es.event_id
        where es.aggregate_type = $1
          and es.aggregate_id = $2
          and es.event_id <> $3
          and ik.status = 'Processed'
        order by es.recorded_at asc
      `,
      [event.aggregate_type, event.aggregate_id, event.event_id],
    )

    return result.rows.map((row) => this.toStoredEvent(row).event)
  }

  private async markIdempotencyStatus(idempotencyKey: string, status: ProcessingStatus) {
    await query(
      `
        update idempotency_keys
        set status = $2,
            processed_at = now()
        where idempotency_key = $1
      `,
      [idempotencyKey, status],
    )
  }

  private async findDuplicate(eventId: string, idempotencyKey: string) {
    const result = await query<EventStoreRow>(
      `
        select
          es.event_id,
          es.event_type,
          es.aggregate_id,
          es.aggregate_type,
          es.branch_id,
          es.actor_id,
          es.payload,
          es.version,
          es.idempotency_key,
          es.occurred_at,
          ik.status as processing_status
        from event_store es
        left join idempotency_keys ik on ik.event_id = es.event_id
        where es.event_id = $1 or es.idempotency_key = $2
        limit 1
      `,
      [eventId, idempotencyKey],
    )

    const row = result.rows[0]
    return row ? this.toStoredEvent(row) : undefined
  }

  private toStoredEvent(row: EventStoreRow): StoredEventRecord {
    const event = validateIncomingEvent({
      event_id: row.event_id,
      event_type: row.event_type,
      aggregate_id: row.aggregate_id,
      aggregate_type: row.aggregate_type,
      branch_id: row.branch_id,
      actor_id: row.actor_id,
      payload: row.payload,
      version: row.version,
      idempotency_key: row.idempotency_key,
      timestamp:
        row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
    })

    return {
      event,
      processingStatus: row.processing_status ?? undefined,
    }
  }
}

export const eventStoreService = new EventStoreService()

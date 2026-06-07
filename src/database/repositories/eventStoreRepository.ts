import type { AppEvent } from '@/events'
import { validateIncomingEvent } from '@/backend/events/validation'
import type { ProcessingStatus } from '@/types/database'
import type { DatabaseClient } from '../client'
import { withTransaction } from '../transactions'
import { resolveClient, toIso } from './helpers'

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

export interface StoredEventRecord {
  event: AppEvent
  processingStatus?: ProcessingStatus
}

export class EventStoreRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async appendEventWithPendingIdempotency(event: AppEvent) {
    if (this.client) {
      await this.insertEvent(this.client, event)
      await this.insertPendingIdempotency(this.client, event)
      return
    }

    await withTransaction(async (client) => {
      await this.insertEvent(client, event)
      await this.insertPendingIdempotency(client, event)
    })
  }

  async findDuplicate(eventId: string, idempotencyKey: string) {
    const result = await resolveClient(this.client).query<EventStoreRow>(
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

    return result.rows[0] ? toStoredEvent(result.rows[0]) : undefined
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const result = await resolveClient(this.client).query<EventStoreRow>(
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

    return result.rows[0] ? toStoredEvent(result.rows[0]) : undefined
  }

  async findPaymentInitiatedByProviderRequestId(providerRequestId: string) {
    const result = await resolveClient(this.client).query<EventStoreRow>(
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

    return result.rows[0] ? toStoredEvent(result.rows[0]) : undefined
  }

  async loadProcessedAggregateEvents(event: AppEvent) {
    const result = await resolveClient(this.client).query<EventStoreRow>(
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

    return result.rows.map((row) => toStoredEvent(row).event)
  }

  async markIdempotencyStatus(idempotencyKey: string, status: ProcessingStatus) {
    await resolveClient(this.client).query(
      `
        update idempotency_keys
        set status = $2,
            processed_at = now()
        where idempotency_key = $1
      `,
      [idempotencyKey, status],
    )
  }

  private async insertEvent(client: DatabaseClient, event: AppEvent) {
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
  }

  private async insertPendingIdempotency(client: DatabaseClient, event: AppEvent) {
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
  }
}

function toStoredEvent(row: EventStoreRow): StoredEventRecord {
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
    timestamp: toIso(row.occurred_at),
  })

  return {
    event,
    processingStatus: row.processing_status ?? undefined,
  }
}

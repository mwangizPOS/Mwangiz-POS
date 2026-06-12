import path from 'node:path'
import { validateIncomingEvent } from '../../backend/events/validation.js'
import type { AppEvent } from '../../events/index.js'
import { SyncStatus, type OutboxEvent } from '../types.js'
import { withDeterministicIdempotencyKey } from '../idempotency.js'

let DatabaseConstructor: any = null
try {
  // Use require so that we can catch native module mismatch errors gracefully
  DatabaseConstructor = require('better-sqlite3')
} catch (error) {
  console.warn('Failed to load better-sqlite3 (native module mismatch). Falling back to in-memory store.', error)
}

export interface OutboxStoreOptions {
  databasePath?: string
}

export interface GetPendingEventsOptions {
  limit?: number
  now?: string
}

interface OutboxRow {
  local_id: string
  event_id: string
  aggregate_id: string
  aggregate_type: string
  event_type: string
  branch_id: string
  idempotency_key: string
  event_payload: string
  status: SyncStatus
  retry_count: number
  next_retry_at: string | null
  last_attempt_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
  synced_at: string | null
  sequence: number
}

const DEFAULT_LIMIT = 100

export class OutboxStore {
  private readonly database: any
  private inMemoryStore: OutboxRow[] = []
  private sequenceCounter = 0

  constructor(options: OutboxStoreOptions = {}) {
    if (DatabaseConstructor) {
      const databasePath =
        options.databasePath ??
        process.env.MWANGI_POS_SYNC_DB_PATH ??
        path.join(process.cwd(), 'mwangi-pos-offline.sqlite')

      this.database = new DatabaseConstructor(databasePath)
      this.database.pragma('journal_mode = WAL')
      this.database.pragma('foreign_keys = ON')
      this.ensureSchema()
    } else {
      console.warn('Initializing in-memory outbox store.')
    }
  }

  appendEvent(input: AppEvent): OutboxEvent {
    const event = validateIncomingEvent(withDeterministicIdempotencyKey(input))
    const now = new Date().toISOString()

    if (!this.database) {
      const existing = this.inMemoryStore.find((r) => r.event_id === event.event_id)
      if (existing) {
        existing.event_payload = JSON.stringify(event)
        existing.idempotency_key = event.idempotency_key
        existing.updated_at = now
      } else {
        this.sequenceCounter++
        this.inMemoryStore.push({
          local_id: event.event_id,
          event_id: event.event_id,
          aggregate_id: event.aggregate_id,
          aggregate_type: event.aggregate_type,
          event_type: event.event_type,
          branch_id: event.branch_id,
          idempotency_key: event.idempotency_key,
          event_payload: JSON.stringify(event),
          status: SyncStatus.Pending,
          retry_count: 0,
          next_retry_at: null,
          last_attempt_at: null,
          last_error: null,
          created_at: now,
          updated_at: now,
          synced_at: null,
          sequence: this.sequenceCounter,
        })
      }
      return this.getEventById(event.event_id) as OutboxEvent
    }

    this.database
      .prepare(
        `
          insert into sync_outbox (
            local_id,
            event_id,
            aggregate_id,
            aggregate_type,
            event_type,
            branch_id,
            idempotency_key,
            event_payload,
            status,
            retry_count,
            next_retry_at,
            last_attempt_at,
            last_error,
            created_at,
            updated_at,
            synced_at
          )
          values ($localId, $eventId, $aggregateId, $aggregateType, $eventType, $branchId,
            $idempotencyKey, $eventPayload, $status, 0, null, null, null, $now, $now, null)
          on conflict(event_id)
          do update set
            event_payload = excluded.event_payload,
            idempotency_key = excluded.idempotency_key,
            updated_at = excluded.updated_at
        `,
      )
      .run({
        localId: event.event_id,
        eventId: event.event_id,
        aggregateId: event.aggregate_id,
        aggregateType: event.aggregate_type,
        eventType: event.event_type,
        branchId: event.branch_id,
        idempotencyKey: event.idempotency_key,
        eventPayload: JSON.stringify(event),
        status: SyncStatus.Pending,
        now,
      })

    return this.getEventById(event.event_id) as OutboxEvent
  }

  getPendingEvents(options: GetPendingEventsOptions = {}): OutboxEvent[] {
    const now = options.now ?? new Date().toISOString()
    const limit = options.limit ?? DEFAULT_LIMIT
    
    let dueRows: OutboxRow[] = []
    
    if (!this.database) {
      dueRows = this.inMemoryStore
        .filter(r => (r.status === SyncStatus.Pending || r.status === SyncStatus.Failed) && (!r.next_retry_at || r.next_retry_at <= now))
        .sort((a, b) => a.sequence - b.sequence)
        .slice(0, limit)
    } else {
      dueRows = this.database
        .prepare(
          `
            select *
            from sync_outbox
            where status in ($pending, $failed)
              and (next_retry_at is null or next_retry_at <= $now)
            order by sequence asc
            limit $limit
          `,
        )
        .all({
          pending: SyncStatus.Pending,
          failed: SyncStatus.Failed,
          now,
          limit,
        }) as OutboxRow[]
    }

    return dueRows
      .filter((row) => !this.hasBlockingOlderEvent(row, now))
      .map((row) => this.toOutboxEvent(row))
  }

  markEventSyncing(eventId: string): void {
    const now = new Date().toISOString()
    
    if (!this.database) {
      const row = this.inMemoryStore.find(r => r.event_id === eventId && r.status !== SyncStatus.Synced)
      if (row) {
        row.status = SyncStatus.Syncing
        row.last_attempt_at = now
        row.updated_at = now
      }
      return
    }

    this.database
      .prepare(
        `
          update sync_outbox
          set status = $status,
              last_attempt_at = $now,
              updated_at = $now
          where event_id = $eventId
            and status <> $synced
        `,
      )
      .run({
        eventId,
        status: SyncStatus.Syncing,
        synced: SyncStatus.Synced,
        now,
      })
  }

  markEventSynced(eventId: string): void {
    const now = new Date().toISOString()
    
    if (!this.database) {
      const row = this.inMemoryStore.find(r => r.event_id === eventId)
      if (row) {
        row.status = SyncStatus.Synced
        row.synced_at = now
        row.updated_at = now
        row.next_retry_at = null
        row.last_error = null
      }
      return
    }

    this.database
      .prepare(
        `
          update sync_outbox
          set status = $status,
              synced_at = $now,
              updated_at = $now,
              next_retry_at = null,
              last_error = null
          where event_id = $eventId
        `,
      )
      .run({
        eventId,
        status: SyncStatus.Synced,
        now,
      })
  }

  markEventFailed(eventId: string, nextRetryAt: string, errorMessage: string): void {
    const now = new Date().toISOString()
    
    if (!this.database) {
      const row = this.inMemoryStore.find(r => r.event_id === eventId && r.status !== SyncStatus.Synced)
      if (row) {
        row.status = SyncStatus.Failed
        row.retry_count += 1
        row.next_retry_at = nextRetryAt
        row.last_error = errorMessage
        row.updated_at = now
      }
      return
    }

    this.database
      .prepare(
        `
          update sync_outbox
          set status = $status,
              retry_count = retry_count + 1,
              next_retry_at = $nextRetryAt,
              last_error = $errorMessage,
              updated_at = $now
          where event_id = $eventId
            and status <> $synced
        `,
      )
      .run({
        eventId,
        status: SyncStatus.Failed,
        synced: SyncStatus.Synced,
        nextRetryAt,
        errorMessage,
        now,
      })
  }

  resetSyncingEvents(): void {
    const now = new Date().toISOString()
    
    if (!this.database) {
      this.inMemoryStore.forEach(row => {
        if (row.status === SyncStatus.Syncing) {
          row.status = SyncStatus.Pending
          row.updated_at = now
        }
      })
      return
    }

    this.database
      .prepare(
        `
          update sync_outbox
          set status = $pending,
              updated_at = $now
          where status = $syncing
        `,
      )
      .run({
        pending: SyncStatus.Pending,
        syncing: SyncStatus.Syncing,
        now,
      })
  }

  clearSyncedEvents(): number {
    if (!this.database) {
      const initialLength = this.inMemoryStore.length
      this.inMemoryStore = this.inMemoryStore.filter(r => r.status !== SyncStatus.Synced)
      return initialLength - this.inMemoryStore.length
    }

    const result = this.database
      .prepare(
        `
          delete from sync_outbox
          where status = $status
        `,
      )
      .run({
        status: SyncStatus.Synced,
      })

    return result.changes
  }

  close(): void {
    if (this.database) {
      this.database.close()
    }
  }

  private getEventById(eventId: string): OutboxEvent | undefined {
    if (!this.database) {
      const row = this.inMemoryStore.find(r => r.event_id === eventId)
      return row ? this.toOutboxEvent(row) : undefined
    }

    const row = this.database
      .prepare(
        `
          select *
          from sync_outbox
          where event_id = $eventId
        `,
      )
      .get({ eventId }) as OutboxRow | undefined

    return row ? this.toOutboxEvent(row) : undefined
  }

  private hasBlockingOlderEvent(row: OutboxRow, now: string): boolean {
    if (!this.database) {
      return this.inMemoryStore.some(r => 
        r.aggregate_id === row.aggregate_id && 
        r.sequence < row.sequence && 
        r.status !== SyncStatus.Synced &&
        (r.status === SyncStatus.Syncing || r.next_retry_at === null || r.next_retry_at > now)
      )
    }

    const blocking = this.database
      .prepare(
        `
          select 1
          from sync_outbox
          where aggregate_id = $aggregateId
            and sequence < $sequence
            and status <> $synced
            and (
              status = $syncing
              or next_retry_at is null
              or next_retry_at > $now
            )
          limit 1
        `,
      )
      .get({
        aggregateId: row.aggregate_id,
        sequence: row.sequence,
        synced: SyncStatus.Synced,
        syncing: SyncStatus.Syncing,
        now,
      })

    return Boolean(blocking)
  }

  private toOutboxEvent(row: OutboxRow): OutboxEvent {
    return {
      localId: row.local_id,
      eventId: row.event_id,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      eventType: row.event_type,
      branchId: row.branch_id,
      idempotencyKey: row.idempotency_key,
      event: validateIncomingEvent(JSON.parse(row.event_payload)),
      status: row.status,
      retryState: {
        retryCount: row.retry_count,
        nextRetryAt: row.next_retry_at,
        lastAttemptAt: row.last_attempt_at,
        lastError: row.last_error,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at,
      sequence: row.sequence,
    }
  }

  private ensureSchema(): void {
    this.database.exec(`
      create table if not exists sync_outbox (
        sequence integer primary key autoincrement,
        local_id text not null unique,
        event_id text not null unique,
        aggregate_id text not null,
        aggregate_type text not null,
        event_type text not null,
        branch_id text not null,
        idempotency_key text not null unique,
        event_payload text not null,
        status text not null,
        retry_count integer not null default 0,
        next_retry_at text null,
        last_attempt_at text null,
        last_error text null,
        created_at text not null,
        updated_at text not null,
        synced_at text null,
        check (retry_count >= 0),
        check (length(trim(event_id)) > 0),
        check (length(trim(idempotency_key)) > 0),
        check (status in ('Pending', 'Syncing', 'Synced', 'Failed'))
      );

      create index if not exists idx_sync_outbox_status_retry
        on sync_outbox (status, next_retry_at, sequence);

      create index if not exists idx_sync_outbox_aggregate_order
        on sync_outbox (aggregate_id, sequence);

      create index if not exists idx_sync_outbox_branch_status
        on sync_outbox (branch_id, status);
    `)
  }
}

export function createOutboxStore(options: OutboxStoreOptions = {}) {
  return new OutboxStore(options)
}

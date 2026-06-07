import { withTransaction } from '@/config/database'
import { validateIncomingEvent } from '@/backend/events/validation'
import type { AppEvent } from '@/events'
import { reduceProjectionEvent } from './reducers'
import { ProjectionName, type ProjectionBatchResult, type ProjectionEngineOptions, type ProjectionReplayResult } from './types'

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
}

const DEFAULT_BATCH_SIZE = 500

export async function processPendingProjectionEvents(
  options: ProjectionEngineOptions = {},
): Promise<ProjectionBatchResult> {
  const projectionName = options.projectionName ?? ProjectionName.Main
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE
  const stopOnError = options.stopOnError ?? true
  const events = await loadPendingEvents(projectionName, batchSize)
  const result: ProjectionBatchResult = {
    projectionName,
    processed: 0,
    skipped: 0,
    failures: [],
    finishedAt: new Date().toISOString(),
  }

  for (const event of events) {
    try {
      const applied = await applyProjectionEvent(event, projectionName)

      if (applied) {
        result.processed += 1
      } else {
        result.skipped += 1
      }
    } catch (error) {
      result.failures.push({
        eventId: event.event_id,
        eventType: event.event_type,
        message: error instanceof Error ? error.message : 'Unknown projection error.',
      })

      if (stopOnError) {
        break
      }
    }
  }

  result.finishedAt = new Date().toISOString()
  return result
}

export async function rebuildProjectionsFromEventStore(
  options: ProjectionEngineOptions = {},
): Promise<ProjectionReplayResult> {
  const projectionName = options.projectionName ?? ProjectionName.Main
  const startedAt = new Date().toISOString()

  await withTransaction(async (client) => {
    await client.query(
      `
        truncate table
          projection_processed_events,
          audit_projection,
          refund_projection,
          branch_revenue_projection,
          worker_earnings_projection,
          sale_items_projection,
          sales_projection
      `,
    )
  })

  let processed = 0
  let skipped = 0
  const failures: ProjectionReplayResult['failures'] = []

  while (true) {
    const batch = await processPendingProjectionEvents({
      ...options,
      projectionName,
      stopOnError: true,
    })

    processed += batch.processed
    skipped += batch.skipped
    failures.push(...batch.failures)

    if (batch.failures.length > 0 || batch.processed + batch.skipped === 0) {
      break
    }
  }

  return {
    projectionName,
    processed,
    skipped,
    failures,
    startedAt,
    finishedAt: new Date().toISOString(),
  }
}

async function applyProjectionEvent(event: AppEvent, projectionName: string) {
  return withTransaction(async (client) => {
    const claim = await client.query<{ event_id: string }>(
      `
        insert into projection_processed_events (
          projection_name,
          event_id,
          event_type,
          aggregate_id
        )
        values ($1, $2, $3, $4)
        on conflict (projection_name, event_id)
        do nothing
        returning event_id
      `,
      [projectionName, event.event_id, event.event_type, event.aggregate_id],
    )

    if (claim.rowCount === 0) {
      return false
    }

    await reduceProjectionEvent(event, {
      client,
      projectionName,
    })

    return true
  })
}

async function loadPendingEvents(projectionName: string, limit: number) {
  return withTransaction(async (client) => {
    const result = await client.query<EventStoreRow>(
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
          es.occurred_at
        from event_store es
        inner join idempotency_keys ik on ik.event_id = es.event_id
        left join projection_processed_events ppe
          on ppe.event_id = es.event_id
          and ppe.projection_name = $1
        where ik.status = 'Processed'
          and ppe.event_id is null
        order by
          es.occurred_at asc,
          es.aggregate_id asc,
          es.version asc,
          es.recorded_at asc,
          es.event_id asc
        limit $2
      `,
      [projectionName, limit],
    )

    return result.rows.map(toAppEvent)
  })
}

function toAppEvent(row: EventStoreRow) {
  return validateIncomingEvent({
    event_id: row.event_id,
    event_type: row.event_type,
    aggregate_id: row.aggregate_id,
    aggregate_type: row.aggregate_type,
    branch_id: row.branch_id,
    actor_id: row.actor_id,
    payload: row.payload,
    version: row.version,
    idempotency_key: row.idempotency_key,
    timestamp: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
  })
}

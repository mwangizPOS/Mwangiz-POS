import { EventType, type AppEvent } from '@/events'
import type { ProjectionReducerContext } from '../types'

export async function reduceAuditProjectionEvent(
  event: AppEvent,
  context: ProjectionReducerContext,
) {
  if (event.event_type !== EventType.AuditLogCreated) {
    return false
  }

  await context.client.query(
    `
      insert into audit_projection (
        event_id,
        entity_type,
        entity_id,
        action,
        actor_id,
        timestamp
      )
      values ($1, $2, $3, $4, $5, $6)
      on conflict (event_id)
      do update set
        entity_type = excluded.entity_type,
        entity_id = excluded.entity_id,
        action = excluded.action,
        actor_id = excluded.actor_id,
        timestamp = excluded.timestamp
    `,
    [
      event.event_id,
      event.payload.entityType,
      event.payload.entityId,
      event.payload.action,
      event.payload.performedBy,
      event.timestamp,
    ],
  )

  return true
}

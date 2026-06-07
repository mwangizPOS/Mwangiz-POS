import type { EventAggregateType, EventType } from './eventTypes'
import type { DateTimeString, EntityId } from '@/types/primitives'

export interface EventEnvelope<
  TEventType extends EventType = EventType,
  TAggregateType extends EventAggregateType = EventAggregateType,
  TPayload extends object = object,
> {
  event_id: EntityId
  event_type: TEventType
  aggregate_id: EntityId
  aggregate_type: TAggregateType
  branch_id: EntityId
  timestamp: DateTimeString
  actor_id: EntityId
  payload: TPayload
  version: number
  idempotency_key: string
}

export type DomainEventEnvelope<
  TEventType extends EventType = EventType,
  TAggregateType extends EventAggregateType = EventAggregateType,
  TPayload extends object = object,
> = EventEnvelope<TEventType, TAggregateType, TPayload>

export type IntegrationEventEnvelope<
  TEventType extends EventType = EventType,
  TAggregateType extends EventAggregateType = EventAggregateType,
  TPayload extends object = object,
> = EventEnvelope<TEventType, TAggregateType, TPayload>

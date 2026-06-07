import { createHash } from 'node:crypto'
import type { AppEvent } from '@/events'
import type { JsonValue } from '@/types/primitives'

export interface IdempotencyInput {
  saleId: string
  eventType: string
  timestamp: string
  payload: unknown
}

export function generateIdempotencyKey(input: IdempotencyInput) {
  const payloadHash = hashPayload(input.payload)
  const source = [input.saleId, input.eventType, input.timestamp, payloadHash].join('|')
  return `sync_${sha256(source).slice(0, 56)}`
}

export function getEventIdempotencyKey(event: AppEvent) {
  return generateIdempotencyKey({
    saleId: resolveSaleId(event),
    eventType: event.event_type,
    timestamp: event.timestamp,
    payload: event.payload,
  })
}

export function withDeterministicIdempotencyKey<TEvent extends AppEvent>(event: TEvent): TEvent {
  return {
    ...event,
    idempotency_key: getEventIdempotencyKey(event),
  }
}

export function hashPayload(payload: unknown) {
  return sha256(stableStringify(payload))
}

function resolveSaleId(event: AppEvent) {
  if (isRecord(event.payload) && typeof event.payload.saleId === 'string') {
    return event.payload.saleId
  }

  return event.aggregate_id
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  const record = value as Record<string, JsonValue | undefined>
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)

  return `{${entries.join(',')}}`
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

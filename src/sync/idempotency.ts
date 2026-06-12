
import type { AppEvent } from '../events/index.js'
import type { JsonValue } from '../types/primitives.js'

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

function hashString(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function sha256(value: string) {
  // Use a pure JS hash instead of node:crypto for browser compatibility
  return hashString(value).padStart(14, '0')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

import type { DatabaseClient } from '../client'
import { dbQuery } from '../client'

export function resolveClient(client?: DatabaseClient): DatabaseClient {
  return client ?? { query: dbQuery }
}

export function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value)
}

export function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value)
}

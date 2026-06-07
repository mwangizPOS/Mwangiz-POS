import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from '@/config/env'

export interface DatabaseClient {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<QueryResult<T>>
}

export const databasePool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
})

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return databasePool.query<T>(text, values)
}

export async function checkDatabaseConnection() {
  try {
    await dbQuery('select 1 as ok')
    return {
      status: 'connected' as const,
    }
  } catch (error) {
    return {
      status: 'unavailable' as const,
      message: error instanceof Error ? error.message : 'Unknown database error.',
    }
  }
}

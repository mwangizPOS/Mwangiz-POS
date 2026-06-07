import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import { env } from './env'

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
})

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, values)
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()

  try {
    await client.query('begin')
    const result = await callback(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

export async function withAdvisoryLock<T>(
  lockKey: string,
  callback: () => Promise<T>,
): Promise<T> {
  const client = await pool.connect()

  try {
    await client.query('select pg_advisory_lock(hashtextextended($1, 0))', [lockKey])
    return await callback()
  } finally {
    await client.query('select pg_advisory_unlock(hashtextextended($1, 0))', [lockKey])
    client.release()
  }
}

export async function checkDatabaseConnection() {
  try {
    await query('select 1 as ok')
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

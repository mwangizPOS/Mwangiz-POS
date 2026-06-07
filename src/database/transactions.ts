import { databasePool } from './client'
import type { PoolClient } from 'pg'

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await databasePool.connect()

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
  const client = await databasePool.connect()

  try {
    await client.query('select pg_advisory_lock(hashtextextended($1, 0))', [lockKey])
    return await callback()
  } finally {
    await client.query('select pg_advisory_unlock(hashtextextended($1, 0))', [lockKey])
    client.release()
  }
}

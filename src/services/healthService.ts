import { checkDatabaseConnection } from '@/config/database'

export async function getHealthStatus() {
  const database = await checkDatabaseConnection()

  return {
    status: database.status === 'connected' ? 'ok' : 'degraded',
    database,
    eventProcessor: {
      status: 'ready' as const,
      mode: 'stateless-replay',
    },
    checkedAt: new Date().toISOString(),
  }
}

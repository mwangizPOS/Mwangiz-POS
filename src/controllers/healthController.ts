import type { Request, Response } from 'express'
import { getHealthStatus } from '@/services/healthService'

export async function healthCheck(_request: Request, response: Response) {
  const health = await getHealthStatus()
  response.status(health.status === 'ok' ? 200 : 503).json(health)
}

import type { Request, Response } from 'express'
import { syncRetryRequestSchema } from '@/validation/apiSchemas'
import { syncService } from '@/services/syncService'

export async function retrySyncBatch(request: Request, response: Response) {
  const body = syncRetryRequestSchema.parse(request.body)
  const result = await syncService.retry(body)

  response.status(202).json({
    success: true,
    data: result,
  })
}

import type { Request, Response } from 'express'
import { eventIngestionRequestSchema } from '@/validation/apiSchemas'
import { eventStoreService } from '@/services/eventStoreService'

export async function ingestEvent(request: Request, response: Response) {
  const event = eventIngestionRequestSchema.parse(request.body)
  const result = await eventStoreService.ingest(event)
  const statusCode = result.status === 'rejected' ? 422 : result.status === 'duplicate' ? 200 : 202

  response.status(statusCode).json({
    success: result.status !== 'rejected',
    data: result,
  })
}

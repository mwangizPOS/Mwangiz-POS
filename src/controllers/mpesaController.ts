import type { Request, Response } from 'express'
import { mpesaCallbackRequestSchema, mpesaStkPushRequestSchema } from '@/validation/apiSchemas'
import { mpesaService } from '@/services/mpesaService'

interface RawBodyRequest extends Request {
  rawBody?: string
}

export async function initiateStkPush(request: Request, response: Response) {
  const body = mpesaStkPushRequestSchema.parse(request.body)
  const result = await mpesaService.stkPush(body)

  response.status(result.event.status === 'duplicate' ? 200 : 202).json({
    success: true,
    data: result,
  })
}

export async function receiveMpesaCallback(request: RawBodyRequest, response: Response) {
  const body = mpesaCallbackRequestSchema.parse(request.body)

  response.status(200).json({
    success: true,
    data: {
      accepted: true,
    },
  })

  void mpesaService.handleCallback(body, request.headers, request.rawBody).catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown M-Pesa callback error.'
    console.error('[mpesa-callback]', message)
  })
}

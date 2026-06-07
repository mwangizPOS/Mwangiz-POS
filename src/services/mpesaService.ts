import axios from 'axios'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { withAdvisoryLock } from '@/config/database'
import { env, requireConfig } from '@/config/env'
import { PaymentMethod, PaymentStatus } from '@/domain/enums'
import { EventAggregateType, EventType, type PaymentInitiatedEvent } from '@/events'
import type {
  MpesaCallbackBody,
  MpesaStkPushRequest,
  MpesaStkPushResponse,
} from '@/types/api'
import { ApiError } from '@/middleware/errors'
import { eventStoreService, type EventStoreService } from './eventStoreService'

interface DarajaStkResponse {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResponseCode?: string
  ResponseDescription?: string
  CustomerMessage?: string
}

interface ParsedCallback {
  merchantRequestId?: string
  checkoutRequestId: string
  resultCode: number
  resultDescription?: string
  amount?: number
  mpesaReceiptNumber?: string
  phoneNumber?: string | number
}

export class MpesaService {
  private readonly events: EventStoreService

  constructor(events: EventStoreService) {
    this.events = events
  }

  async stkPush(request: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    return withAdvisoryLock(`mpesa-stk:${request.idempotency_key}`, async () => {
      const existingEvent = await this.events.findByIdempotencyKey(request.idempotency_key)

      if (existingEvent?.event.event_type === EventType.PaymentInitiated) {
        const payload = existingEvent.event.payload
        const checkoutRequestId = payload.providerRequestId

        if (!checkoutRequestId) {
          throw new ApiError(
            409,
            'PaymentInitiationPending',
            'Payment initiation already exists but has no provider request ID.',
          )
        }

        return {
          saleId: request.sale_id,
          checkoutRequestId,
          merchantRequestId: payload.merchantRequestId ?? undefined,
          event: {
            eventId: existingEvent.event.event_id,
            idempotencyKey: existingEvent.event.idempotency_key,
            status: 'duplicate',
          },
        }
      }

      const darajaResponse = await this.callStkPush(request)
      const checkoutRequestId = darajaResponse.CheckoutRequestID

      if (!checkoutRequestId) {
        throw new ApiError(
          502,
          'MpesaCheckoutRequestMissing',
          'Daraja did not return a checkout request ID.',
        )
      }

      const now = new Date().toISOString()
      const event: PaymentInitiatedEvent = {
        event_id: uuidv4(),
        event_type: EventType.PaymentInitiated,
        aggregate_id: request.sale_id,
        aggregate_type: EventAggregateType.Sale,
        branch_id: request.branch_id,
        actor_id: request.actor_id,
        payload: {
          saleId: request.sale_id,
          paymentMethod: PaymentMethod.Mpesa,
          amount: request.amount,
          paymentStatus: PaymentStatus.Pending,
          providerRequestId: checkoutRequestId,
          merchantRequestId: darajaResponse.MerchantRequestID ?? null,
        },
        version: 1,
        timestamp: now,
        idempotency_key: request.idempotency_key,
      }

      const eventResult = await this.events.ingest(event)

      if (eventResult.status === 'rejected') {
        throw new ApiError(422, 'PaymentInitiatedEventRejected', 'Payment event was rejected.', {
          eventId: eventResult.eventId,
        })
      }

      return {
        saleId: request.sale_id,
        checkoutRequestId,
        merchantRequestId: darajaResponse.MerchantRequestID,
        event: eventResult,
      }
    })
  }

  async handleCallback(
    body: MpesaCallbackBody,
    headers: Record<string, string | string[] | undefined>,
    rawBody?: string,
  ) {
    this.validateCallbackSignature(body, headers, rawBody)

    const callback = this.parseCallback(body)

    if (callback.resultCode !== 0) {
      return {
        status: 'ignored' as const,
        checkoutRequestId: callback.checkoutRequestId,
        resultCode: callback.resultCode,
        message: callback.resultDescription ?? 'M-Pesa callback was not successful.',
      }
    }

    const initiated = await this.events.findPaymentInitiatedByProviderRequestId(
      callback.checkoutRequestId,
    )

    if (!initiated || initiated.event.event_type !== EventType.PaymentInitiated) {
      throw new ApiError(
        404,
        'PaymentInitiationNotFound',
        'No processed PaymentInitiated event matches this M-Pesa callback.',
      )
    }

    const initiatedPayload = initiated.event.payload
    const now = new Date().toISOString()
    const receipt = callback.mpesaReceiptNumber ?? callback.checkoutRequestId
    const completedEvent = {
      event_id: uuidv4(),
      event_type: EventType.PaymentCompleted,
      aggregate_id: initiated.event.aggregate_id,
      aggregate_type: EventAggregateType.Sale,
      branch_id: initiated.event.branch_id,
      actor_id: initiated.event.actor_id,
      payload: {
        saleId: initiatedPayload.saleId,
        paymentMethod: PaymentMethod.Mpesa,
        amount: callback.amount ?? initiatedPayload.amount,
        paymentStatus: PaymentStatus.Paid,
        paymentReference: receipt,
        providerRequestId: callback.checkoutRequestId,
        merchantRequestId: callback.merchantRequestId ?? initiatedPayload.merchantRequestId ?? null,
        completedAt: now,
      },
      version: 1,
      timestamp: now,
      idempotency_key: `mpesa-callback:${callback.checkoutRequestId}:${receipt}`,
    }

    return this.events.ingest(completedEvent)
  }

  private async callStkPush(request: MpesaStkPushRequest) {
    const token = await this.getAccessToken()
    const timestamp = createDarajaTimestamp()
    const shortcode = requireConfig(env.mpesa.shortcode, 'MPESA_SHORTCODE')
    const passkey = requireConfig(env.mpesa.passkey, 'MPESA_PASSKEY')
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
    const amount = Math.round(request.amount)
    const phoneNumber = normalizeKenyanPhone(request.phone_number)

    const response = await axios.post<DarajaStkResponse>(
      `${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: env.mpesa.transactionType,
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: requireConfig(env.mpesa.callbackUrl, 'MPESA_CALLBACK_URL'),
        AccountReference: request.account_reference ?? request.sale_id,
        TransactionDesc: request.description ?? 'MWANGIZ Salon POS payment',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      },
    )

    return response.data
  }

  private async getAccessToken() {
    const consumerKey = requireConfig(env.mpesa.consumerKey, 'MPESA_CONSUMER_KEY')
    const consumerSecret = requireConfig(env.mpesa.consumerSecret, 'MPESA_CONSUMER_SECRET')
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

    const response = await axios.get<{ access_token?: string }>(
      `${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        timeout: 30_000,
      },
    )

    if (!response.data.access_token) {
      throw new ApiError(502, 'MpesaTokenMissing', 'Daraja did not return an access token.')
    }

    return response.data.access_token
  }

  private validateCallbackSignature(
    body: MpesaCallbackBody,
    headers: Record<string, string | string[] | undefined>,
    rawBody?: string,
  ) {
    if (!env.mpesa.callbackSecret) {
      return
    }

    const provided = getHeader(headers, 'x-mpesa-signature') ?? getHeader(headers, 'x-mwangi-signature')

    if (!provided) {
      throw new ApiError(401, 'MpesaCallbackSignatureMissing', 'Callback signature is required.')
    }

    const payload = rawBody ?? JSON.stringify(body)
    const expected = createHmac('sha256', env.mpesa.callbackSecret).update(payload).digest('hex')
    const providedBuffer = Buffer.from(provided, 'hex')
    const expectedBuffer = Buffer.from(expected, 'hex')

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new ApiError(401, 'MpesaCallbackSignatureInvalid', 'Callback signature is invalid.')
    }
  }

  private parseCallback(body: MpesaCallbackBody): ParsedCallback {
    const callback = body.Body?.stkCallback

    if (!callback?.CheckoutRequestID || typeof callback.ResultCode !== 'number') {
      throw new ApiError(400, 'MpesaCallbackMalformed', 'Callback payload is missing STK data.')
    }

    const metadata = callback.CallbackMetadata?.Item ?? []

    return {
      merchantRequestId: callback.MerchantRequestID,
      checkoutRequestId: callback.CheckoutRequestID,
      resultCode: callback.ResultCode,
      resultDescription: callback.ResultDesc,
      amount: getMetadataNumber(metadata, 'Amount'),
      mpesaReceiptNumber: getMetadataString(metadata, 'MpesaReceiptNumber'),
      phoneNumber: getMetadataString(metadata, 'PhoneNumber') ?? getMetadataNumber(metadata, 'PhoneNumber'),
    }
  }
}

function getDarajaBaseUrl() {
  return env.mpesa.environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

function createDarajaTimestamp() {
  const value = new Date()
  const pad = (part: number) => String(part).padStart(2, '0')

  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
    pad(value.getHours()),
    pad(value.getMinutes()),
    pad(value.getSeconds()),
  ].join('')
}

function normalizeKenyanPhone(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '')

  if (digits.startsWith('254') && digits.length === 12) {
    return digits
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `254${digits.slice(1)}`
  }

  if (digits.length === 9 && digits.startsWith('7')) {
    return `254${digits}`
  }

  throw new ApiError(400, 'InvalidMpesaPhoneNumber', 'Use a valid Kenyan M-Pesa phone number.')
}

function getMetadataString(items: { Name: string; Value?: string | number }[], name: string) {
  const value = items.find((item) => item.Name === name)?.Value
  return typeof value === 'string' ? value : undefined
}

function getMetadataNumber(items: { Name: string; Value?: string | number }[], name: string) {
  const value = items.find((item) => item.Name === name)?.Value

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string) {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

export const mpesaService = new MpesaService(eventStoreService)

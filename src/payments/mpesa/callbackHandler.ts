import { createHmac, timingSafeEqual } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { PaymentMethod, PaymentStatus } from '@/domain/enums'
import { EventAggregateType, EventType, type PaymentCompletedEvent } from '@/events'
import { generateIdempotencyKey } from '@/sync'
import type {
  MpesaInitiationLookup,
  PaymentEventPublisher,
  SalePaymentContextProvider,
} from '../types'

export interface DarajaCallbackBody {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResultCode?: number
      ResultDesc?: string
      CallbackMetadata?: {
        Item?: DarajaCallbackMetadataItem[]
      }
    }
  }
}

export interface DarajaCallbackMetadataItem {
  Name: string
  Value?: string | number
}

export interface MpesaCallbackHandlerOptions {
  initiationLookup: MpesaInitiationLookup
  saleProvider: SalePaymentContextProvider
  eventPublisher: PaymentEventPublisher
  callbackSecret?: string
  now?: () => string
}

export class MpesaCallbackHandler {
  private readonly initiationLookup: MpesaInitiationLookup
  private readonly saleProvider: SalePaymentContextProvider
  private readonly eventPublisher: PaymentEventPublisher
  private readonly callbackSecret?: string
  private readonly now: () => string

  constructor(options: MpesaCallbackHandlerOptions) {
    this.initiationLookup = options.initiationLookup
    this.saleProvider = options.saleProvider
    this.eventPublisher = options.eventPublisher
    this.callbackSecret = options.callbackSecret ?? process.env.MPESA_CALLBACK_SECRET
    this.now = options.now ?? (() => new Date().toISOString())
  }

  async handleCallback(
    body: DarajaCallbackBody,
    headers: Record<string, string | string[] | undefined> = {},
    rawBody?: string,
  ) {
    validateRequestSignature(body, headers, this.callbackSecret, rawBody)
    const callback = parseDarajaCallback(body)

    if (callback.resultCode !== 0) {
      return {
        status: 'FAILED' as const,
        checkoutRequestId: callback.checkoutRequestId,
        message: callback.resultDescription ?? 'M-Pesa callback was not successful.',
      }
    }

    const initiated = await this.initiationLookup.findByCheckoutRequestId(
      callback.checkoutRequestId,
    )

    if (!initiated) {
      throw new Error('No M-Pesa initiation record matches the callback checkout request.')
    }

    const sale = await this.saleProvider.getSalePaymentContext(initiated.saleId)
    const callbackAmount = callback.amount ?? initiated.amount

    if (sale.saleId !== initiated.saleId) {
      throw new Error('M-Pesa callback sale does not match initiated sale.')
    }

    if (roundMoney(callbackAmount) !== roundMoney(initiated.amount)) {
      throw new Error('M-Pesa callback amount does not match initiated amount.')
    }

    if (roundMoney(callbackAmount) !== roundMoney(sale.totalAmount)) {
      throw new Error('M-Pesa callback amount does not match sale total.')
    }

    const timestamp = this.now()
    const receipt = callback.mpesaReceiptNumber ?? callback.checkoutRequestId
    const payload = {
      saleId: sale.saleId,
      paymentMethod: PaymentMethod.Mpesa,
      amount: callbackAmount,
      paymentStatus: PaymentStatus.Paid,
      paymentReference: receipt,
      providerRequestId: callback.checkoutRequestId,
      merchantRequestId: callback.merchantRequestId ?? initiated.merchantRequestId ?? null,
      completedAt: timestamp,
    }
    const event: PaymentCompletedEvent = {
      event_id: uuidv4(),
      event_type: EventType.PaymentCompleted,
      aggregate_id: sale.saleId,
      aggregate_type: EventAggregateType.Sale,
      branch_id: sale.branchId,
      actor_id: initiated.actorId,
      payload,
      version: 1,
      timestamp,
      idempotency_key: generateIdempotencyKey({
        saleId: sale.saleId,
        eventType: EventType.PaymentCompleted,
        timestamp,
        payload: {
          ...payload,
          callback: callback.checkoutRequestId,
        },
      }),
    }

    const publishResults = await this.eventPublisher.publishPaymentEvents([event], {
      saleId: sale.saleId,
      branchId: sale.branchId,
      actorId: initiated.actorId,
      mode: 'MpesaOnlineStk',
      offline: false,
    })

    return {
      status: 'PROCESSED' as const,
      checkoutRequestId: callback.checkoutRequestId,
      receiptNumber: receipt,
      event,
      publishResults,
    }
  }
}

export function parseDarajaCallback(body: DarajaCallbackBody) {
  const callback = body.Body?.stkCallback

  if (!callback?.CheckoutRequestID || typeof callback.ResultCode !== 'number') {
    throw new Error('M-Pesa callback payload is missing STK callback details.')
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

export function validateRequestSignature(
  body: DarajaCallbackBody,
  headers: Record<string, string | string[] | undefined>,
  secret: string | undefined,
  rawBody?: string,
) {
  if (!secret) {
    return
  }

  const provided =
    getHeader(headers, 'x-mpesa-signature') ??
    getHeader(headers, 'x-mwangi-signature') ??
    getHeader(headers, 'x-request-signature')

  if (!provided) {
    throw new Error('M-Pesa callback signature is required.')
  }

  const expected = createHmac('sha256', secret)
    .update(rawBody ?? JSON.stringify(body))
    .digest('hex')
  const providedBuffer = Buffer.from(provided, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('M-Pesa callback signature is invalid.')
  }
}

function getMetadataString(items: DarajaCallbackMetadataItem[], name: string) {
  const value = items.find((item) => item.Name === name)?.Value
  return typeof value === 'string' ? value : undefined
}

function getMetadataNumber(items: DarajaCallbackMetadataItem[], name: string) {
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

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

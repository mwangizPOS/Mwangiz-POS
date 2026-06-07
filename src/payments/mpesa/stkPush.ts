import axios from 'axios'
import type {
  BranchMpesaCredentials,
  DarajaApplicationCredentials,
  MpesaProviderReference,
  OnlineMpesaPaymentRequest,
  SalePaymentContext,
} from '../types'

export interface DarajaStkPushResponse {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResponseCode?: string
  ResponseDescription?: string
  CustomerMessage?: string
}

export interface StkPushRequest {
  sale: SalePaymentContext
  payment: OnlineMpesaPaymentRequest
  branchCredentials: BranchMpesaCredentials
}

export class DarajaStkPushClient {
  private readonly appCredentials: DarajaApplicationCredentials

  constructor(appCredentials?: Partial<DarajaApplicationCredentials>) {
    this.appCredentials = {
      consumerKey: requireValue(
        appCredentials?.consumerKey ??
          process.env.DARAJA_CONSUMER_KEY ??
          process.env.MPESA_CONSUMER_KEY,
        'DARAJA_CONSUMER_KEY',
      ),
      consumerSecret: requireValue(
        appCredentials?.consumerSecret ??
          process.env.DARAJA_CONSUMER_SECRET ??
          process.env.MPESA_CONSUMER_SECRET,
        'DARAJA_CONSUMER_SECRET',
      ),
      environment:
        appCredentials?.environment ??
        (process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox'),
      callbackBaseUrl: requireValue(
        appCredentials?.callbackBaseUrl ??
          process.env.CALLBACK_BASE_URL ??
          process.env.MPESA_CALLBACK_URL,
        'CALLBACK_BASE_URL',
      ),
      transactionType:
        appCredentials?.transactionType ??
        process.env.MPESA_TRANSACTION_TYPE ??
        'CustomerPayBillOnline',
    }
  }

  async stkPush(request: StkPushRequest): Promise<MpesaProviderReference> {
    const token = await this.getAccessToken()
    const timestamp = createDarajaTimestamp()
    const phoneNumber = normalizeKenyanPhone(request.payment.phoneNumber)
    const shortcode = request.branchCredentials.shortcode
    const amount = Math.round(request.payment.amount)
    const password = createStkPassword(
      shortcode,
      request.branchCredentials.passkey,
      timestamp,
    )
    const response = await axios.post<DarajaStkPushResponse>(
      `${getDarajaBaseUrl(this.appCredentials.environment)}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: this.appCredentials.transactionType,
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: request.branchCredentials.tillNumber || shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: createCallbackUrl(this.appCredentials.callbackBaseUrl),
        AccountReference: request.sale.saleNumber ?? request.sale.saleId,
        TransactionDesc: 'MWANGIZ Salon POS payment',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      },
    )

    return {
      merchantRequestId: response.data.MerchantRequestID ?? null,
      checkoutRequestId: response.data.CheckoutRequestID ?? null,
      phoneNumber,
    }
  }

  private async getAccessToken() {
    const credentials = Buffer.from(
      `${this.appCredentials.consumerKey}:${this.appCredentials.consumerSecret}`,
    ).toString('base64')
    const response = await axios.get<{ access_token?: string }>(
      `${getDarajaBaseUrl(this.appCredentials.environment)}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        timeout: 30_000,
      },
    )

    if (!response.data.access_token) {
      throw new Error('Daraja did not return an access token.')
    }

    return response.data.access_token
  }
}

export function createStkPassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

export function normalizeKenyanPhone(phoneNumber: string) {
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

  throw new Error('Use a valid Kenyan M-Pesa phone number.')
}

export function createDarajaTimestamp() {
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

function getDarajaBaseUrl(environment: DarajaApplicationCredentials['environment']) {
  return environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

function createCallbackUrl(callbackBaseUrl: string) {
  if (callbackBaseUrl.endsWith('/api/mpesa/callback')) {
    return callbackBaseUrl
  }

  return `${callbackBaseUrl.replace(/\/$/, '')}/api/mpesa/callback`
}

function requireValue(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is required.`)
  }

  return value
}

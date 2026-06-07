import type { EventProcessingResult } from '@/backend/events'
import type { AppEvent } from '@/events'
import type { EntityId, MoneyAmount } from './primitives'

export interface EventIngestionResponse {
  eventId: EntityId
  idempotencyKey: string
  status: 'processed' | 'duplicate' | 'rejected'
  processorResult?: EventProcessingResult
}

export interface MpesaStkPushRequest {
  phone_number: string
  amount: MoneyAmount
  sale_id: EntityId
  branch_id: EntityId
  actor_id: EntityId
  idempotency_key: string
  account_reference?: string
  description?: string
}

export interface MpesaStkPushResponse {
  saleId: EntityId
  checkoutRequestId: string
  merchantRequestId?: string
  event: EventIngestionResponse
}

export interface MpesaCallbackMetadataItem {
  Name: string
  Value?: string | number
}

export interface MpesaCallbackBody {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResultCode?: number
      ResultDesc?: string
      CallbackMetadata?: {
        Item?: MpesaCallbackMetadataItem[]
      }
    }
  }
}

export interface SyncRetryEventResult {
  eventId: EntityId
  idempotencyKey: string
  status: 'processed' | 'duplicate' | 'rejected'
  message?: string
}

export interface SyncRetryResponse {
  batchId: EntityId
  accepted: SyncRetryEventResult[]
  duplicates: SyncRetryEventResult[]
  rejected: SyncRetryEventResult[]
  processedAt: string
}

export interface StoredEventRecord {
  event: AppEvent
  processingStatus?: 'Pending' | 'Processed' | 'Rejected'
}

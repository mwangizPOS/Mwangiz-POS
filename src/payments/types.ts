import type { PaymentMethod, PaymentStatus, SaleStatus } from '@/domain/enums'
import type {
  AppEvent,
  PaymentCompletedEvent,
  PaymentInitiatedEvent,
  SplitPaymentRecordedEvent,
} from '@/events'
import type { NetworkState } from '@/sync'
import type { DateTimeString, EntityId, MoneyAmount } from '@/types/primitives'

export const PaymentExecutionStatus = {
  PendingProvider: 'PENDING_PROVIDER',
  PendingSync: 'PENDING_SYNC',
  Processed: 'PROCESSED',
  Duplicate: 'DUPLICATE',
  Failed: 'FAILED',
  Rejected: 'REJECTED',
} as const

export type PaymentExecutionStatus =
  (typeof PaymentExecutionStatus)[keyof typeof PaymentExecutionStatus]

export const PaymentExecutionMode = {
  Cash: 'Cash',
  Bank: 'Bank',
  MpesaOnlineStk: 'MpesaOnlineStk',
  MpesaOfflineManual: 'MpesaOfflineManual',
  Mixed: 'Mixed',
} as const

export type PaymentExecutionMode =
  (typeof PaymentExecutionMode)[keyof typeof PaymentExecutionMode]

export interface SalePaymentContext {
  saleId: EntityId
  saleNumber?: string
  branchId: EntityId
  totalAmount: MoneyAmount
  paymentStatus?: PaymentStatus
  status?: SaleStatus
  createdBy?: EntityId
}

export interface BranchMpesaCredentials {
  branchId: EntityId
  shortcode: string
  passkey: string
  tillNumber: string
  mpesaEnabled: boolean
}

export interface DarajaApplicationCredentials {
  consumerKey: string
  consumerSecret: string
  environment: 'sandbox' | 'production'
  callbackBaseUrl: string
  transactionType?: string
}

export interface SalePaymentContextProvider {
  getSalePaymentContext: (saleId: EntityId) => Promise<SalePaymentContext>
}

export interface BranchMpesaCredentialProvider {
  getMpesaCredentialsForBranch: (
    branchId: EntityId,
  ) => Promise<BranchMpesaCredentials | null>
}

export interface PaymentEventPublishResult {
  status: 'processed' | 'duplicate' | 'queued' | 'rejected'
  eventId: EntityId
  idempotencyKey: string
  message?: string
}

export interface PaymentEventPublisher {
  publishPaymentEvents: (
    events: AppEvent[],
    context: PaymentPublishContext,
  ) => Promise<PaymentEventPublishResult[]>
}

export interface PaymentSyncQueue {
  captureEvent: (event: AppEvent) => Promise<unknown>
}

export interface PaymentNetworkDetector {
  isOnline: () => Promise<boolean>
  getNetworkState?: () => Promise<NetworkState>
}

export interface PaymentIdempotencyGuard {
  runExclusive: <TResult>(
    idempotencyKey: string,
    operation: () => Promise<TResult>,
  ) => Promise<TResult>
}

export interface PaymentPublishContext {
  saleId: EntityId
  branchId: EntityId
  actorId: EntityId
  mode: PaymentExecutionMode
  offline: boolean
}

export interface PaymentExecutionResult {
  saleId: EntityId
  branchId: EntityId
  mode: PaymentExecutionMode
  status: PaymentExecutionStatus
  events: AppEvent[]
  publishResults: PaymentEventPublishResult[]
  provider?: MpesaProviderReference
  message?: string
}

export interface MpesaProviderReference {
  merchantRequestId?: string | null
  checkoutRequestId?: string | null
  receiptNumber?: string | null
  phoneNumber?: string
}

export interface BasePaymentRequest {
  saleId: EntityId
  actorId: EntityId
  amount: MoneyAmount
  requestedAt?: DateTimeString
  idempotencyKey?: string
}

export interface CashPaymentRequest extends BasePaymentRequest {
  cashReference?: string | null
}

export interface BankPaymentRequest extends BasePaymentRequest {
  bankReference: string
}

export interface OnlineMpesaPaymentRequest extends BasePaymentRequest {
  phoneNumber: string
}

export interface ManualMpesaPaymentRequest extends BasePaymentRequest {
  phoneNumber: string
  receiptNumber: string
}

export interface SplitPaymentComponent {
  method: Exclude<PaymentMethod, 'Mixed'>
  amount: MoneyAmount
  reference?: string | null
  phoneNumber?: string | null
}

export interface MixedPaymentRequest extends BasePaymentRequest {
  components: SplitPaymentComponent[]
}

export type PaymentLifecycleEvent =
  | PaymentInitiatedEvent
  | PaymentCompletedEvent
  | SplitPaymentRecordedEvent

export interface ExistingMpesaInitiation {
  saleId: EntityId
  branchId: EntityId
  actorId: EntityId
  amount: MoneyAmount
  checkoutRequestId: string
  merchantRequestId?: string | null
  idempotencyKey: string
}

export interface MpesaInitiationLookup {
  findByIdempotencyKey?: (
    idempotencyKey: string,
  ) => Promise<ExistingMpesaInitiation | null>
  findByCheckoutRequestId: (
    checkoutRequestId: string,
  ) => Promise<ExistingMpesaInitiation | null>
}

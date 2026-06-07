import { v4 as uuidv4 } from 'uuid'
import { PaymentMethod, PaymentStatus } from '@/domain/enums'
import {
  EventAggregateType,
  EventType,
  type AppEvent,
  type PaymentCompletedEvent,
  type PaymentInitiatedEvent,
} from '@/events'
import { generateIdempotencyKey } from '@/sync'
import { assertPaymentNotFinalized } from './paymentStateMachine'
import {
  createSplitPaymentRecordedEvent,
  normalizeSplitComponents,
  validateSplitPaymentTotal,
} from './splitPayments'
import {
  PaymentExecutionMode,
  PaymentExecutionStatus,
  type BankPaymentRequest,
  type BranchMpesaCredentialProvider,
  type CashPaymentRequest,
  type ManualMpesaPaymentRequest,
  type MixedPaymentRequest,
  type OnlineMpesaPaymentRequest,
  type PaymentEventPublisher,
  type PaymentExecutionResult,
  type PaymentIdempotencyGuard,
  type PaymentNetworkDetector,
  type PaymentPublishContext,
  type PaymentSyncQueue,
  type SalePaymentContext,
  type SalePaymentContextProvider,
  type MpesaProviderReference,
} from './types'
import { DarajaStkPushClient } from './mpesa/stkPush'

export interface PaymentOrchestratorOptions {
  saleProvider: SalePaymentContextProvider
  eventPublisher: PaymentEventPublisher
  branchCredentialProvider: BranchMpesaCredentialProvider
  networkDetector: PaymentNetworkDetector
  syncQueue?: PaymentSyncQueue
  stkPushClient?: DarajaStkPushClient
  idempotencyGuard?: PaymentIdempotencyGuard
  now?: () => string
}

export class PaymentOrchestrator {
  private readonly saleProvider: SalePaymentContextProvider
  private readonly eventPublisher: PaymentEventPublisher
  private readonly branchCredentialProvider: BranchMpesaCredentialProvider
  private readonly networkDetector: PaymentNetworkDetector
  private readonly syncQueue?: PaymentSyncQueue
  private readonly stkPushClient: DarajaStkPushClient
  private readonly idempotencyGuard: PaymentIdempotencyGuard
  private readonly now: () => string

  constructor(options: PaymentOrchestratorOptions) {
    this.saleProvider = options.saleProvider
    this.eventPublisher = options.eventPublisher
    this.branchCredentialProvider = options.branchCredentialProvider
    this.networkDetector = options.networkDetector
    this.syncQueue = options.syncQueue
    this.stkPushClient = options.stkPushClient ?? new DarajaStkPushClient()
    this.idempotencyGuard = options.idempotencyGuard ?? createInMemoryIdempotencyGuard()
    this.now = options.now ?? (() => new Date().toISOString())
  }

  async payCash(request: CashPaymentRequest): Promise<PaymentExecutionResult> {
    const sale = await this.loadSale(request.saleId)
    const timestamp = request.requestedAt ?? this.now()
    const event = createPaymentCompletedEvent({
      sale,
      actorId: request.actorId,
      method: PaymentMethod.Cash,
      amount: request.amount,
      reference: request.cashReference ?? null,
      timestamp,
      idempotencyKey: request.idempotencyKey,
    })

    return this.dispatchPaymentEvents(
      sale,
      request.actorId,
      PaymentExecutionMode.Cash,
      [event],
    )
  }

  async payBank(request: BankPaymentRequest): Promise<PaymentExecutionResult> {
    const sale = await this.loadSale(request.saleId)
    const timestamp = request.requestedAt ?? this.now()
    const event = createPaymentCompletedEvent({
      sale,
      actorId: request.actorId,
      method: PaymentMethod.Bank,
      amount: request.amount,
      reference: request.bankReference,
      timestamp,
      idempotencyKey: request.idempotencyKey,
    })

    return this.dispatchPaymentEvents(
      sale,
      request.actorId,
      PaymentExecutionMode.Bank,
      [event],
    )
  }

  async initiateOnlineMpesa(
    request: OnlineMpesaPaymentRequest,
  ): Promise<PaymentExecutionResult> {
    const sale = await this.loadSale(request.saleId)
    const timestamp = request.requestedAt ?? this.now()
    const idempotencyKey =
      request.idempotencyKey ??
      generatePaymentIdempotencyKey(sale, EventType.PaymentInitiated, timestamp, {
        phoneNumber: request.phoneNumber,
        amount: request.amount,
      })

    return this.idempotencyGuard.runExclusive(idempotencyKey, async () => {
      if (!(await this.networkDetector.isOnline())) {
        return {
          saleId: sale.saleId,
          branchId: sale.branchId,
          mode: PaymentExecutionMode.MpesaOnlineStk,
          status: PaymentExecutionStatus.Rejected,
          events: [],
          publishResults: [],
          message:
            'Network is unavailable. Use offline manual M-Pesa with a receipt number instead.',
        }
      }

      const branchCredentials =
        await this.branchCredentialProvider.getMpesaCredentialsForBranch(sale.branchId)

      if (!branchCredentials?.mpesaEnabled) {
        throw new Error('M-Pesa is not enabled for this branch.')
      }

      const provider = await this.stkPushClient.stkPush({
        sale,
        payment: request,
        branchCredentials,
      })
      const event = createPaymentInitiatedEvent({
        sale,
        actorId: request.actorId,
        method: PaymentMethod.Mpesa,
        amount: request.amount,
        timestamp,
        idempotencyKey,
        providerRequestId: provider.checkoutRequestId ?? null,
        merchantRequestId: provider.merchantRequestId ?? null,
      })
      const publishResults = await this.eventPublisher.publishPaymentEvents([event], {
        saleId: sale.saleId,
        branchId: sale.branchId,
        actorId: request.actorId,
        mode: PaymentExecutionMode.MpesaOnlineStk,
        offline: false,
      })

      return {
        saleId: sale.saleId,
        branchId: sale.branchId,
        mode: PaymentExecutionMode.MpesaOnlineStk,
        status: PaymentExecutionStatus.PendingProvider,
        events: [event],
        publishResults,
        provider,
      }
    })
  }

  async payManualMpesa(
    request: ManualMpesaPaymentRequest,
  ): Promise<PaymentExecutionResult> {
    const sale = await this.loadSale(request.saleId)
    const timestamp = request.requestedAt ?? this.now()
    const event = createPaymentCompletedEvent({
      sale,
      actorId: request.actorId,
      method: PaymentMethod.Mpesa,
      amount: request.amount,
      reference: request.receiptNumber,
      timestamp,
      idempotencyKey: request.idempotencyKey,
      providerRequestId: null,
      merchantRequestId: null,
    })

    return this.dispatchPaymentEvents(
      sale,
      request.actorId,
      PaymentExecutionMode.MpesaOfflineManual,
      [event],
      {
        receiptNumber: request.receiptNumber,
        phoneNumber: request.phoneNumber,
      },
    )
  }

  async payMixed(request: MixedPaymentRequest): Promise<PaymentExecutionResult> {
    const sale = await this.loadSale(request.saleId)
    const timestamp = request.requestedAt ?? this.now()
    const components = normalizeSplitComponents(request.components)

    validateSplitPaymentTotal(components, sale.totalAmount)

    const initiated = createPaymentInitiatedEvent({
      sale,
      actorId: request.actorId,
      method: PaymentMethod.Mixed,
      amount: request.amount,
      timestamp,
      idempotencyKey: request.idempotencyKey,
    })
    const split = createSplitPaymentRecordedEvent({
      request: {
        ...request,
        components,
      },
      branchId: sale.branchId,
      timestamp,
    })
    const completed = createPaymentCompletedEvent({
      sale,
      actorId: request.actorId,
      method: PaymentMethod.Mixed,
      amount: request.amount,
      reference: `split:${split.payload.splitPaymentId}`,
      timestamp,
    })

    return this.dispatchPaymentEvents(
      sale,
      request.actorId,
      PaymentExecutionMode.Mixed,
      [initiated, split, completed],
    )
  }

  private async loadSale(saleId: string) {
    const sale = await this.saleProvider.getSalePaymentContext(saleId)
    assertPaymentNotFinalized(sale.paymentStatus)
    return sale
  }

  private async dispatchPaymentEvents(
    sale: SalePaymentContext,
    actorId: string,
    mode: PaymentExecutionMode,
    events: AppEvent[],
    provider?: MpesaProviderReference,
  ): Promise<PaymentExecutionResult> {
    const online = await this.networkDetector.isOnline()
    const context: PaymentPublishContext = {
      saleId: sale.saleId,
      branchId: sale.branchId,
      actorId,
      mode,
      offline: !online,
    }

    if (!online && this.syncQueue) {
      const publishResults = []

      for (const event of events) {
        await this.syncQueue.captureEvent(event)
        publishResults.push({
          status: 'queued' as const,
          eventId: event.event_id,
          idempotencyKey: event.idempotency_key,
        })
      }

      return {
        saleId: sale.saleId,
        branchId: sale.branchId,
        mode,
        status: PaymentExecutionStatus.PendingSync,
        events,
        publishResults,
        provider,
      }
    }

    const publishResults = await this.eventPublisher.publishPaymentEvents(events, context)
    const rejected = publishResults.find((result) => result.status === 'rejected')
    const duplicateOnly = publishResults.every((result) => result.status === 'duplicate')

    return {
      saleId: sale.saleId,
      branchId: sale.branchId,
      mode,
      status: rejected
        ? PaymentExecutionStatus.Rejected
        : duplicateOnly
          ? PaymentExecutionStatus.Duplicate
          : PaymentExecutionStatus.Processed,
      events,
      publishResults,
      provider,
      message: rejected?.message,
    }
  }
}

function createPaymentInitiatedEvent(input: {
  sale: SalePaymentContext
  actorId: string
  method: PaymentMethod
  amount: number
  timestamp: string
  idempotencyKey?: string
  providerRequestId?: string | null
  merchantRequestId?: string | null
}) {
  const payload = {
    saleId: input.sale.saleId,
    paymentMethod: input.method,
    amount: input.amount,
    paymentStatus: PaymentStatus.Pending,
    providerRequestId: input.providerRequestId ?? null,
    merchantRequestId: input.merchantRequestId ?? null,
  }

  return {
    event_id: uuidv4(),
    event_type: EventType.PaymentInitiated,
    aggregate_id: input.sale.saleId,
    aggregate_type: EventAggregateType.Sale,
    branch_id: input.sale.branchId,
    actor_id: input.actorId,
    payload,
    version: 1,
    timestamp: input.timestamp,
    idempotency_key:
      input.idempotencyKey ??
      generatePaymentIdempotencyKey(
        input.sale,
        EventType.PaymentInitiated,
        input.timestamp,
        payload,
      ),
  } satisfies PaymentInitiatedEvent
}

function createPaymentCompletedEvent(input: {
  sale: SalePaymentContext
  actorId: string
  method: PaymentMethod
  amount: number
  reference?: string | null
  timestamp: string
  idempotencyKey?: string
  providerRequestId?: string | null
  merchantRequestId?: string | null
}) {
  if (roundMoney(input.amount) !== roundMoney(input.sale.totalAmount)) {
    throw new Error('Payment amount must equal sale total.')
  }

  const payload = {
    saleId: input.sale.saleId,
    paymentMethod: input.method,
    amount: input.amount,
    paymentStatus: PaymentStatus.Paid,
    paymentReference: input.reference ?? null,
    providerRequestId: input.providerRequestId ?? null,
    merchantRequestId: input.merchantRequestId ?? null,
    completedAt: input.timestamp,
  }

  return {
    event_id: uuidv4(),
    event_type: EventType.PaymentCompleted,
    aggregate_id: input.sale.saleId,
    aggregate_type: EventAggregateType.Sale,
    branch_id: input.sale.branchId,
    actor_id: input.actorId,
    payload,
    version: 1,
    timestamp: input.timestamp,
    idempotency_key:
      input.idempotencyKey ??
      generatePaymentIdempotencyKey(
        input.sale,
        EventType.PaymentCompleted,
        input.timestamp,
        payload,
      ),
  } satisfies PaymentCompletedEvent
}

function generatePaymentIdempotencyKey(
  sale: SalePaymentContext,
  eventType: string,
  timestamp: string,
  payload: unknown,
) {
  return generateIdempotencyKey({
    saleId: sale.saleId,
    eventType,
    timestamp,
    payload,
  })
}

function createInMemoryIdempotencyGuard(): PaymentIdempotencyGuard {
  const activeKeys = new Set<string>()

  return {
    async runExclusive(idempotencyKey, operation) {
      if (activeKeys.has(idempotencyKey)) {
        throw new Error('Payment operation is already running for this idempotency key.')
      }

      activeKeys.add(idempotencyKey)

      try {
        return await operation()
      } finally {
        activeKeys.delete(idempotencyKey)
      }
    },
  }
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

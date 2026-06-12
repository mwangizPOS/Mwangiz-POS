import { v4 as uuidv4 } from 'uuid'
import { EventAggregateType, EventType } from '../events/eventTypes.js'
import type { AppEvent } from '../events/events.js'
import { PaymentMethod, PaymentStatus, RefundStatus, SaleItemStatus, SaleStatus, RefundTarget } from '../domain/enums.js'
import type { CashierPaymentMethod, CashierSaleDraft, CashierSplitPaymentDraft, CashierSaleClientDraft, CashierSaleItemDraft } from '../types/cashier.js'

export interface SubmitSaleIntent {
  draftSale: CashierSaleDraft
  paymentMethod: CashierPaymentMethod
  splitPayments: CashierSplitPaymentDraft[]
  mpesaReference: string
  bankReference: string
  offlineMode: boolean
  total: number
}

export interface RequestRefundIntent {
  saleId: string
  targetItemId?: string
  amount: number
  reason: string
  refundType: 'Full Refund' | 'Item Refund' | 'Partial Item Refund'
}

export interface ApproveRefundIntent {
  refundId: string
  saleId: string
  approvedBy: string
}

export interface RejectRefundIntent {
  refundId: string
  saleId: string
  rejectedBy: string
  rejectionReason: string
}

export function translateSubmitSaleIntent(intent: SubmitSaleIntent, actorId: string): AppEvent[] {
  const events: AppEvent[] = []
  const timestamp = new Date().toISOString()
  // Generate a predictable Sale ID based on draft or use a new one
  const saleId = uuidv4()
  const branchId = uuidv4() // Assuming branch is resolved server-side or from context, but we need an ID

  // 1. SaleCreated
  events.push({
    event_id: uuidv4(),
    event_type: EventType.SaleCreated,
    aggregate_type: EventAggregateType.Sale,
    aggregate_id: saleId,
    branch_id: branchId,
    actor_id: actorId,
    version: 1,
    idempotency_key: `sale-created-${saleId}`,
    payload: {
      saleId,
      saleNumber: intent.draftSale.saleNumber,
      branchId,
      status: SaleStatus.Completed,
      clients: intent.draftSale.clients.map((c: CashierSaleClientDraft) => ({
        saleClientId: c.id,
        label: c.label,
      })),
    },
    timestamp: timestamp,
  })

  // 2. SaleItemAdded for each item
  intent.draftSale.clients.forEach((client: CashierSaleClientDraft) => {
    client.items.forEach((item: CashierSaleItemDraft) => {
      events.push({
        event_id: uuidv4(),
        event_type: EventType.SaleItemAdded,
        aggregate_type: EventAggregateType.Sale,
        aggregate_id: saleId,
        branch_id: branchId,
        actor_id: actorId,
        version: 1,
        idempotency_key: `sale-item-added-${item.id}`,
        payload: {
          saleId,
          saleItemId: item.id,
          saleClientId: client.id,
          serviceId: item.serviceId,
          workerId: item.workerId,
          quantity: 1,
          price: item.price,
          commissionRateSnapshot: 40, // Assume backend resolves this or we pass it
          status: SaleItemStatus.Active,
        },
        timestamp: timestamp,
      })
    })
  })

  // 3. PaymentInitiated/Completed
  if (intent.paymentMethod === 'Mixed') {
    events.push({
      event_id: uuidv4(),
      event_type: EventType.SplitPaymentRecorded,
      aggregate_type: EventAggregateType.Sale,
      aggregate_id: saleId,
      branch_id: branchId,
      actor_id: actorId,
      version: 1,
      idempotency_key: `split-payment-${saleId}`,
      payload: {
        saleId,
        splitPaymentId: uuidv4(),
        amount: intent.total,
        components: intent.splitPayments.map((sp) => ({
          method: PaymentMethod.Cash, // Map to correct domain PaymentMethod
          amount: sp.amount,
        })),
      },
      timestamp: timestamp,
    })
  } else {
    events.push({
      event_id: uuidv4(),
      event_type: EventType.PaymentCompleted,
      aggregate_type: EventAggregateType.Sale,
      aggregate_id: saleId,
      branch_id: branchId,
      actor_id: actorId,
      version: 1,
      idempotency_key: `payment-completed-${saleId}`,
      payload: {
        saleId,
        paymentMethod: PaymentMethod.Cash, // Should map based on intent.paymentMethod
        amount: intent.total,
        paymentStatus: PaymentStatus.Paid,
        completedAt: timestamp,
      },
      timestamp: timestamp,
    })
  }

  // 4. SaleCompleted
  events.push({
    event_id: uuidv4(),
    event_type: EventType.SaleCompleted,
    aggregate_type: EventAggregateType.Sale,
    aggregate_id: saleId,
    branch_id: branchId,
    actor_id: actorId,
    version: 1,
    idempotency_key: `sale-completed-${saleId}`,
    payload: {
      saleId,
      totalAmount: intent.total,
      status: SaleStatus.Completed,
      completedAt: timestamp,
    },
    timestamp: timestamp,
  })

  return events
}

export function translateRequestRefundIntent(intent: RequestRefundIntent, branchId: string, actorId: string): AppEvent[] {
  const refundId = uuidv4()
  const timestamp = new Date().toISOString()
  
  return [
    {
      event_id: uuidv4(),
      event_type: EventType.RefundRequested,
      aggregate_type: EventAggregateType.Sale,
      aggregate_id: intent.saleId,
      branch_id: branchId,
      actor_id: actorId,
      version: 1,
      idempotency_key: `refund-requested-${refundId}`,
      payload: {
        refundId,
        saleId: intent.saleId,
        saleItemId: intent.targetItemId,
        refundTarget: intent.refundType === 'Full Refund' ? RefundTarget.Sale : RefundTarget.SaleItem, // Type narrowing
        refundType: 'Full', // Domain mapping
        amount: intent.amount,
        reason: intent.reason,
        status: RefundStatus.Pending,
      },
      timestamp: timestamp,
    }
  ]
}

export function translateApproveRefundIntent(intent: ApproveRefundIntent, branchId: string, actorId: string): AppEvent[] {
  const timestamp = new Date().toISOString()
  return [
    {
      event_id: uuidv4(),
      event_type: EventType.RefundApproved,
      aggregate_type: EventAggregateType.Sale,
      aggregate_id: intent.saleId,
      branch_id: branchId,
      actor_id: actorId,
      version: 1,
      idempotency_key: `refund-approved-${intent.refundId}`,
      payload: {
        refundId: intent.refundId,
        approvedBy: intent.approvedBy,
        approvedAt: timestamp,
        status: RefundStatus.Approved,
      },
      timestamp: timestamp,
    }
  ]
}

export function translateRejectRefundIntent(intent: RejectRefundIntent, branchId: string, actorId: string): AppEvent[] {
  const timestamp = new Date().toISOString()
  return [
    {
      event_id: uuidv4(),
      event_type: EventType.RefundRejected,
      aggregate_type: EventAggregateType.Sale,
      aggregate_id: intent.saleId,
      branch_id: branchId,
      actor_id: actorId,
      version: 1,
      idempotency_key: `refund-rejected-${intent.refundId}`,
      payload: {
        refundId: intent.refundId,
        rejectedBy: intent.rejectedBy,
        rejectedAt: timestamp,
        rejectionReason: intent.rejectionReason,
        status: RefundStatus.Rejected,
      },
      timestamp: timestamp,
    }
  ]
}

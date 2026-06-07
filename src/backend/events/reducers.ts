import { applySaleItemRevenue, getSaleItemGross, getSaleItemNet, roundMoney } from './money'
import { createSettlementTrigger } from './settlementTriggers'
import type { ProjectionStore } from './store'
import {
  assertRefundableAmount,
  assertSaleItemBelongsToSale,
  assertSaleTotalMatchesItems,
  assertSplitPaymentMatchesSale,
  recalculateSaleTotals,
  requireInvariant,
  requireProjection,
  resolveRefundSaleId,
} from './invariants'
import { EventProcessingError, EventProcessingErrorCode } from './errors'
import type {
  ProjectionUpdateSummary,
  RefundProjection,
  SaleItemProjection,
  WorkerSettlementProjection,
  SettlementRecalculationTrigger,
} from './projectionTypes'
import { createProjectionUpdateSummary, pushUnique } from './projections'
import {
  PaymentStatus,
  RefundStatus,
  SaleItemStatus,
  SaleStatus,
  SettlementStatus,
  SyncStatus,
} from '@/domain/enums'
import { EventType, type AppEvent } from '@/events'

export interface ReducerResult {
  projectionUpdates: ProjectionUpdateSummary
  settlementTriggers: SettlementRecalculationTrigger[]
}

interface ReducerContext {
  store: ProjectionStore
  projectionUpdates: ProjectionUpdateSummary
  settlementTriggers: SettlementRecalculationTrigger[]
}

export async function reduceEvent(event: AppEvent, store: ProjectionStore) {
  const context: ReducerContext = {
    store,
    projectionUpdates: createProjectionUpdateSummary(),
    settlementTriggers: [],
  }

  switch (event.event_type) {
    case EventType.SaleCreated:
      await handleSaleCreated(event, context)
      break
    case EventType.SaleCompleted:
      await handleSaleCompleted(event, context)
      break
    case EventType.SaleCancelled:
      await handleSaleCancelled(event, context)
      break
    case EventType.SaleItemAdded:
      await handleSaleItemAdded(event, context)
      break
    case EventType.SaleItemUpdated:
      await handleSaleItemUpdated(event, context)
      break
    case EventType.SaleItemRemoved:
      await handleSaleItemRemoved(event, context)
      break
    case EventType.PaymentInitiated:
      await handlePaymentInitiated(event, context)
      break
    case EventType.PaymentCompleted:
      await handlePaymentCompleted(event, context)
      break
    case EventType.SplitPaymentRecorded:
      await handleSplitPaymentRecorded(event, context)
      break
    case EventType.RefundRequested:
      await handleRefundRequested(event, context)
      break
    case EventType.RefundApproved:
      await handleRefundApproved(event, context)
      break
    case EventType.RefundRejected:
      await handleRefundRejected(event, context)
      break
    case EventType.RefundProcessed:
      await handleRefundProcessed(event, context)
      break
    case EventType.WorkerSettlementCalculated:
      await handleWorkerSettlementCalculated(event, context)
      break
    case EventType.WorkerPaid:
      await handleWorkerPaid(event, context)
      break
    case EventType.WorkerSettlementMarkedPaid:
      await handleWorkerSettlementMarkedPaid(event, context)
      break
    case EventType.AuditLogCreated:
      await handleAuditLogCreated(event, context)
      break
    default:
      throw new EventProcessingError(
        EventProcessingErrorCode.UnsupportedEvent,
        'Unsupported event type.',
      )
  }

  return {
    projectionUpdates: context.projectionUpdates,
    settlementTriggers: context.settlementTriggers,
  } satisfies ReducerResult
}

async function handleSaleCreated(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleCreated }>,
  context: ReducerContext,
) {
  const existingSale = await context.store.getSale(event.payload.saleId)

  requireInvariant(!existingSale, `Sale ${event.payload.saleId} already exists.`)

  await context.store.saveSale({
    id: event.payload.saleId,
    saleNumber: event.payload.saleNumber,
    branchId: event.payload.branchId,
    status: event.payload.status,
    paymentMethod: null,
    paymentStatus: PaymentStatus.Pending,
    subtotal: 0,
    refundAmount: 0,
    totalAmount: 0,
    syncStatus: SyncStatus.Synced,
    createdBy: event.actor_id,
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
  })

  for (const client of event.payload.clients) {
    await context.store.saveSaleClient({
      id: client.saleClientId,
      saleId: event.payload.saleId,
      label: client.label,
      createdAt: event.timestamp,
    })
  }

  pushUnique(context.projectionUpdates.sales, event.payload.saleId)
}

async function handleSaleCompleted(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleCompleted }>,
  context: ReducerContext,
) {
  const sale = requireProjection(
    await context.store.getSale(event.payload.saleId),
    `Sale ${event.payload.saleId} does not exist.`,
  )
  const items = await context.store.getSaleItemsBySaleId(sale.id)

  assertSaleTotalMatchesItems(sale, items)
  requireInvariant(
    sale.totalAmount === event.payload.totalAmount,
    'Sale completion total must match sale item total.',
  )

  await context.store.saveSale({
    ...sale,
    status: SaleStatus.Completed,
    completedAt: event.payload.completedAt,
    updatedAt: event.timestamp,
  })

  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handleSaleCancelled(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleCancelled }>,
  context: ReducerContext,
) {
  const sale = requireProjection(
    await context.store.getSale(event.payload.saleId),
    `Sale ${event.payload.saleId} does not exist.`,
  )

  await context.store.saveSale({
    ...sale,
    status: SaleStatus.Cancelled,
    cancelledAt: event.timestamp,
    updatedAt: event.timestamp,
  })

  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handleSaleItemAdded(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleItemAdded }>,
  context: ReducerContext,
) {
  const sale = requireProjection(
    await context.store.getSale(event.payload.saleId),
    `Sale ${event.payload.saleId} does not exist.`,
  )

  if (event.payload.saleClientId) {
    const saleClient = requireProjection(
      await context.store.getSaleClient(event.payload.saleClientId),
      `Sale client ${event.payload.saleClientId} does not exist.`,
    )
    requireInvariant(saleClient.saleId === sale.id, 'Sale client must belong to the same sale.')
  }

  const item = applySaleItemRevenue({
    id: event.payload.saleItemId,
    saleId: sale.id,
    saleClientId: event.payload.saleClientId ?? null,
    serviceId: event.payload.serviceId,
    workerId: event.payload.workerId,
    quantity: event.payload.quantity,
    price: event.payload.price,
    commissionRateSnapshot: event.payload.commissionRateSnapshot,
    workerRevenue: 0,
    salonRevenue: 0,
    refundedAmount: 0,
    status: event.payload.status,
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
  })

  await context.store.saveSaleItem(item)
  await recalculateSaleTotals(context.store, sale.id, event.timestamp)
  queueSettlementTrigger(context, item.workerId, sale.branchId, EventType.SaleItemAdded)

  pushUnique(context.projectionUpdates.saleItems, item.id)
  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handleSaleItemUpdated(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleItemUpdated }>,
  context: ReducerContext,
) {
  const existingItem = requireProjection(
    await context.store.getSaleItem(event.payload.saleItemId),
    `Sale item ${event.payload.saleItemId} does not exist.`,
  )
  assertSaleItemBelongsToSale(existingItem, event.payload.saleId)

  const sale = requireProjection(
    await context.store.getSale(existingItem.saleId),
    `Sale ${existingItem.saleId} does not exist.`,
  )

  const updatedItem = applySaleItemRevenue({
    ...existingItem,
    saleClientId: event.payload.saleClientId ?? existingItem.saleClientId,
    serviceId: event.payload.serviceId ?? existingItem.serviceId,
    workerId: event.payload.workerId ?? existingItem.workerId,
    quantity: event.payload.quantity ?? existingItem.quantity,
    price: event.payload.price ?? existingItem.price,
    commissionRateSnapshot:
      event.payload.commissionRateSnapshot ?? existingItem.commissionRateSnapshot,
    status: event.payload.status ?? existingItem.status,
    updatedAt: event.timestamp,
  })

  await context.store.saveSaleItem(updatedItem)
  await recalculateSaleTotals(context.store, sale.id, event.timestamp)

  queueSettlementTrigger(context, existingItem.workerId, sale.branchId, EventType.SaleItemUpdated)
  if (existingItem.workerId !== updatedItem.workerId) {
    queueSettlementTrigger(context, updatedItem.workerId, sale.branchId, EventType.SaleItemUpdated)
  }

  pushUnique(context.projectionUpdates.saleItems, updatedItem.id)
  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handleSaleItemRemoved(
  event: Extract<AppEvent, { event_type: typeof EventType.SaleItemRemoved }>,
  context: ReducerContext,
) {
  const item = requireProjection(
    await context.store.getSaleItem(event.payload.saleItemId),
    `Sale item ${event.payload.saleItemId} does not exist.`,
  )
  assertSaleItemBelongsToSale(item, event.payload.saleId)

  const sale = requireProjection(
    await context.store.getSale(item.saleId),
    `Sale ${item.saleId} does not exist.`,
  )
  const removedItem: SaleItemProjection = {
    ...item,
    status: SaleItemStatus.Removed,
    workerRevenue: 0,
    salonRevenue: 0,
    updatedAt: event.timestamp,
  }

  await context.store.saveSaleItem(removedItem)
  await recalculateSaleTotals(context.store, sale.id, event.timestamp)
  queueSettlementTrigger(context, item.workerId, sale.branchId, EventType.SaleItemRemoved)

  pushUnique(context.projectionUpdates.saleItems, item.id)
  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handlePaymentInitiated(
  event: Extract<AppEvent, { event_type: typeof EventType.PaymentInitiated }>,
  context: ReducerContext,
) {
  const sale = requireProjection(
    await context.store.getSale(event.payload.saleId),
    `Sale ${event.payload.saleId} does not exist.`,
  )

  await context.store.saveSale({
    ...sale,
    paymentMethod: event.payload.paymentMethod,
    paymentStatus: PaymentStatus.Pending,
    updatedAt: event.timestamp,
  })

  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handlePaymentCompleted(
  event: Extract<AppEvent, { event_type: typeof EventType.PaymentCompleted }>,
  context: ReducerContext,
) {
  const sale = requireProjection(
    await context.store.getSale(event.payload.saleId),
    `Sale ${event.payload.saleId} does not exist.`,
  )

  requireInvariant(event.payload.amount === sale.totalAmount, 'Payment amount must equal sale total.')

  await context.store.saveSale({
    ...sale,
    paymentMethod: event.payload.paymentMethod,
    paymentStatus: PaymentStatus.Paid,
    status: SaleStatus.Completed,
    completedAt: event.payload.completedAt,
    updatedAt: event.timestamp,
  })

  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handleSplitPaymentRecorded(
  event: Extract<AppEvent, { event_type: typeof EventType.SplitPaymentRecorded }>,
  context: ReducerContext,
) {
  const sale = requireProjection(
    await context.store.getSale(event.payload.saleId),
    `Sale ${event.payload.saleId} does not exist.`,
  )
  const componentTotal = roundMoney(
    event.payload.components.reduce((sum, component) => sum + component.amount, 0),
  )

  assertSplitPaymentMatchesSale(
    sale.paymentMethod,
    sale.totalAmount,
    event.payload.amount,
    componentTotal,
  )

  await context.store.saveSplitPayment({
    id: event.payload.splitPaymentId,
    saleId: sale.id,
    amount: event.payload.amount,
    components: event.payload.components,
    createdAt: event.timestamp,
  })

  pushUnique(context.projectionUpdates.sales, sale.id)
}

async function handleRefundRequested(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundRequested }>,
  context: ReducerContext,
) {
  const saleId = await resolveRefundSaleId(
    context.store,
    event.payload.refundTarget,
    event.payload.saleId,
    event.payload.saleItemId,
  )
  await assertRefundRequestIsAllowed(
    context.store,
    saleId,
    event.payload.saleItemId,
    event.payload.amount,
  )

  const refund: RefundProjection = {
    id: event.payload.refundId,
    saleId,
    saleItemId: event.payload.saleItemId ?? null,
    refundTarget: event.payload.refundTarget,
    refundType: event.payload.refundType,
    refundAmount: event.payload.amount,
    processedAmount: 0,
    reason: event.payload.reason,
    status: RefundStatus.Pending,
    requestedBy: event.actor_id,
    approvedBy: null,
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
  }

  await context.store.saveRefund(refund)

  pushUnique(context.projectionUpdates.refunds, refund.id)
}

async function handleRefundApproved(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundApproved }>,
  context: ReducerContext,
) {
  const refund = requireProjection(
    await context.store.getRefund(event.payload.refundId),
    `Refund ${event.payload.refundId} does not exist.`,
  )

  await context.store.saveRefund({
    ...refund,
    approvedBy: event.payload.approvedBy,
    status: RefundStatus.Approved,
    updatedAt: event.payload.approvedAt,
  })

  pushUnique(context.projectionUpdates.refunds, refund.id)
}

async function handleRefundRejected(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundRejected }>,
  context: ReducerContext,
) {
  const refund = requireProjection(
    await context.store.getRefund(event.payload.refundId),
    `Refund ${event.payload.refundId} does not exist.`,
  )

  await context.store.saveRefund({
    ...refund,
    status: RefundStatus.Rejected,
    updatedAt: event.payload.rejectedAt,
  })

  pushUnique(context.projectionUpdates.refunds, refund.id)
}

async function handleRefundProcessed(
  event: Extract<AppEvent, { event_type: typeof EventType.RefundProcessed }>,
  context: ReducerContext,
) {
  const refund = requireProjection(
    await context.store.getRefund(event.payload.refundId),
    `Refund ${event.payload.refundId} does not exist.`,
  )

  requireInvariant(refund.status === RefundStatus.Approved, 'Only approved refunds can be processed.')
  requireInvariant(
    event.payload.processedAmount <= refund.refundAmount,
    'Processed refund amount cannot exceed requested amount.',
  )

  const saleId = requireProjection(refund.saleId ?? undefined, 'Processed refund requires a sale.')
  const touchedWorkerIds = await applyRefundToSaleItems(
    context.store,
    saleId,
    refund.saleItemId,
    event.payload.processedAmount,
    event.timestamp,
  )
  const sale = await recalculateSaleTotals(context.store, saleId, event.timestamp)

  await context.store.saveRefund({
    ...refund,
    processedAmount: event.payload.processedAmount,
    status: RefundStatus.Completed,
    updatedAt: event.payload.processedAt,
  })

  for (const workerId of touchedWorkerIds) {
    queueSettlementTrigger(context, workerId, sale.branchId, EventType.RefundProcessed)
  }

  pushUnique(context.projectionUpdates.refunds, refund.id)
  pushUnique(context.projectionUpdates.sales, saleId)
}

async function handleWorkerSettlementCalculated(
  event: Extract<AppEvent, { event_type: typeof EventType.WorkerSettlementCalculated }>,
  context: ReducerContext,
) {
  const items = await context.store.getSaleItemsByWorkerInPeriod(
    event.payload.workerId,
    event.payload.periodStart,
    event.payload.periodEnd,
  )
  const eligibleItems = items.filter((item) => item.status !== SaleItemStatus.Removed)
  const totalEarned = roundMoney(
    eligibleItems.reduce((sum, item) => sum + item.workerRevenue, 0),
  )
  const settlement: WorkerSettlementProjection = {
    id: event.payload.settlementId,
    workerId: event.payload.workerId,
    branchId: event.branch_id,
    periodStart: event.payload.periodStart,
    periodEnd: event.payload.periodEnd,
    totalEarned,
    saleItemIds: eligibleItems.map((item) => item.id),
    status: SettlementStatus.Pending,
    paidBy: null,
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
  }

  await context.store.saveSettlement(settlement)

  pushUnique(context.projectionUpdates.settlements, settlement.id)
}

async function handleWorkerPaid(
  event: Extract<AppEvent, { event_type: typeof EventType.WorkerPaid }>,
  context: ReducerContext,
) {
  const settlement = requireProjection(
    await context.store.getSettlement(event.payload.settlementId),
    `Settlement ${event.payload.settlementId} does not exist.`,
  )

  requireInvariant(
    event.payload.amount === settlement.totalEarned,
    'Worker paid amount must equal settlement earnings.',
  )

  await context.store.saveSettlement({
    ...settlement,
    status: SettlementStatus.Paid,
    paidBy: event.payload.paidBy,
    updatedAt: event.payload.paidAt,
  })

  pushUnique(context.projectionUpdates.settlements, settlement.id)
}

async function handleWorkerSettlementMarkedPaid(
  event: Extract<AppEvent, { event_type: typeof EventType.WorkerSettlementMarkedPaid }>,
  context: ReducerContext,
) {
  const settlement = requireProjection(
    await context.store.getSettlement(event.payload.settlementId),
    `Settlement ${event.payload.settlementId} does not exist.`,
  )

  await context.store.saveSettlement({
    ...settlement,
    status: SettlementStatus.Paid,
    paidBy: event.payload.paidBy,
    updatedAt: event.payload.paidAt,
  })

  pushUnique(context.projectionUpdates.settlements, settlement.id)
}

async function handleAuditLogCreated(
  event: Extract<AppEvent, { event_type: typeof EventType.AuditLogCreated }>,
  context: ReducerContext,
) {
  await context.store.saveAuditLog({
    id: event.payload.auditLogId,
    action: event.payload.action,
    entityType: event.payload.entityType,
    entityId: event.payload.entityId,
    performedBy: event.payload.performedBy,
    branchId: event.payload.branchId,
    metadata: event.payload.metadata,
    timestamp: event.timestamp,
  })

  pushUnique(context.projectionUpdates.auditLogs, event.payload.auditLogId)
}

async function assertRefundRequestIsAllowed(
  store: ProjectionStore,
  saleId: string,
  saleItemId: string | null | undefined,
  amount: number,
) {
  if (saleItemId) {
    const item = requireProjection(
      await store.getSaleItem(saleItemId),
      `Sale item ${saleItemId} does not exist.`,
    )
    assertSaleItemBelongsToSale(item, saleId)
    assertRefundableAmount(amount, getSaleItemNet(item))
    return
  }

  const items = await store.getSaleItemsBySaleId(saleId)
  const remainingRefundable = roundMoney(
    items
      .filter((item) => item.status !== SaleItemStatus.Removed)
      .reduce((sum, item) => sum + getSaleItemNet(item), 0),
  )
  assertRefundableAmount(amount, remainingRefundable)
}

async function applyRefundToSaleItems(
  store: ProjectionStore,
  saleId: string,
  saleItemId: string | null,
  refundAmount: number,
  updatedAt: string,
) {
  if (saleItemId) {
    const item = requireProjection(
      await store.getSaleItem(saleItemId),
      `Sale item ${saleItemId} does not exist.`,
    )
    assertSaleItemBelongsToSale(item, saleId)
    assertRefundableAmount(refundAmount, getSaleItemNet(item))
    await store.saveSaleItem(refundItem(item, refundAmount, updatedAt))
    return [item.workerId]
  }

  const items = (await store.getSaleItemsBySaleId(saleId)).filter(
    (item) => item.status !== SaleItemStatus.Removed,
  )
  let remainingRefund = refundAmount
  const touchedWorkerIds = new Set<string>()

  for (const item of items) {
    if (remainingRefund <= 0) {
      break
    }

    const itemRefund = Math.min(getSaleItemNet(item), remainingRefund)
    if (itemRefund > 0) {
      await store.saveSaleItem(refundItem(item, itemRefund, updatedAt))
      touchedWorkerIds.add(item.workerId)
      remainingRefund = roundMoney(remainingRefund - itemRefund)
    }
  }

  requireInvariant(remainingRefund === 0, 'Sale refund exceeds remaining refundable value.')
  return [...touchedWorkerIds]
}

function refundItem(item: SaleItemProjection, refundAmount: number, updatedAt: string) {
  const refundedAmount = roundMoney(item.refundedAmount + refundAmount)
  const gross = getSaleItemGross(item)
  const status =
    refundedAmount >= gross ? SaleItemStatus.Refunded : SaleItemStatus.PartiallyRefunded

  return applySaleItemRevenue({
    ...item,
    refundedAmount,
    status,
    updatedAt,
  })
}

function queueSettlementTrigger(
  context: ReducerContext,
  workerId: string,
  branchId: string,
  reason:
    | typeof EventType.SaleItemAdded
    | typeof EventType.SaleItemUpdated
    | typeof EventType.SaleItemRemoved
    | typeof EventType.RefundProcessed,
) {
  context.settlementTriggers.push(createSettlementTrigger(workerId, branchId, reason))
}

import type {
  AuditLogProjection,
  RefundProjection,
  SaleClientProjection,
  SaleItemProjection,
  SaleProjection,
  SplitPaymentProjection,
  WorkerSettlementProjection,
} from './projectionTypes'
import type { AppEvent } from '@/events'
import type { EntityId } from '@/types/primitives'

export interface ProjectionStore {
  appendEvent: (event: AppEvent) => Promise<void>

  getSale: (saleId: EntityId) => Promise<SaleProjection | undefined>
  saveSale: (sale: SaleProjection) => Promise<void>

  getSaleClient: (saleClientId: EntityId) => Promise<SaleClientProjection | undefined>
  saveSaleClient: (saleClient: SaleClientProjection) => Promise<void>

  getSaleItem: (saleItemId: EntityId) => Promise<SaleItemProjection | undefined>
  getSaleItemsBySaleId: (saleId: EntityId) => Promise<SaleItemProjection[]>
  getSaleItemsByWorkerInPeriod: (
    workerId: EntityId,
    periodStart: string,
    periodEnd: string,
  ) => Promise<SaleItemProjection[]>
  saveSaleItem: (saleItem: SaleItemProjection) => Promise<void>

  getSplitPaymentBySaleId: (saleId: EntityId) => Promise<SplitPaymentProjection | undefined>
  saveSplitPayment: (splitPayment: SplitPaymentProjection) => Promise<void>

  getRefund: (refundId: EntityId) => Promise<RefundProjection | undefined>
  getRefundsBySaleId: (saleId: EntityId) => Promise<RefundProjection[]>
  saveRefund: (refund: RefundProjection) => Promise<void>

  getSettlement: (settlementId: EntityId) => Promise<WorkerSettlementProjection | undefined>
  saveSettlement: (settlement: WorkerSettlementProjection) => Promise<void>

  saveAuditLog: (auditLog: AuditLogProjection) => Promise<void>
}

export class InMemoryProjectionStore implements ProjectionStore {
  readonly events: AppEvent[] = []
  readonly sales = new Map<EntityId, SaleProjection>()
  readonly saleClients = new Map<EntityId, SaleClientProjection>()
  readonly saleItems = new Map<EntityId, SaleItemProjection>()
  readonly splitPayments = new Map<EntityId, SplitPaymentProjection>()
  readonly refunds = new Map<EntityId, RefundProjection>()
  readonly settlements = new Map<EntityId, WorkerSettlementProjection>()
  readonly auditLogs = new Map<EntityId, AuditLogProjection>()

  async appendEvent(event: AppEvent) {
    this.events.push(event)
  }

  async getSale(saleId: EntityId) {
    return this.sales.get(saleId)
  }

  async saveSale(sale: SaleProjection) {
    this.sales.set(sale.id, sale)
  }

  async getSaleClient(saleClientId: EntityId) {
    return this.saleClients.get(saleClientId)
  }

  async saveSaleClient(saleClient: SaleClientProjection) {
    this.saleClients.set(saleClient.id, saleClient)
  }

  async getSaleItem(saleItemId: EntityId) {
    return this.saleItems.get(saleItemId)
  }

  async getSaleItemsBySaleId(saleId: EntityId) {
    return [...this.saleItems.values()].filter((item) => item.saleId === saleId)
  }

  async getSaleItemsByWorkerInPeriod(
    workerId: EntityId,
    periodStart: string,
    periodEnd: string,
  ) {
    const start = Date.parse(periodStart)
    const end = Date.parse(periodEnd)

    return [...this.saleItems.values()].filter((item) => {
      const createdAt = Date.parse(item.createdAt)
      return item.workerId === workerId && createdAt >= start && createdAt <= end
    })
  }

  async saveSaleItem(saleItem: SaleItemProjection) {
    this.saleItems.set(saleItem.id, saleItem)
  }

  async getSplitPaymentBySaleId(saleId: EntityId) {
    return [...this.splitPayments.values()].find((payment) => payment.saleId === saleId)
  }

  async saveSplitPayment(splitPayment: SplitPaymentProjection) {
    this.splitPayments.set(splitPayment.id, splitPayment)
  }

  async getRefund(refundId: EntityId) {
    return this.refunds.get(refundId)
  }

  async getRefundsBySaleId(saleId: EntityId) {
    return [...this.refunds.values()].filter((refund) => refund.saleId === saleId)
  }

  async saveRefund(refund: RefundProjection) {
    this.refunds.set(refund.id, refund)
  }

  async getSettlement(settlementId: EntityId) {
    return this.settlements.get(settlementId)
  }

  async saveSettlement(settlement: WorkerSettlementProjection) {
    this.settlements.set(settlement.id, settlement)
  }

  async saveAuditLog(auditLog: AuditLogProjection) {
    this.auditLogs.set(auditLog.id, auditLog)
  }
}

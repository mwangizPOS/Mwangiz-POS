import type { PoolClient } from 'pg'
import { SaleItemStatus, SaleStatus } from '@/domain/enums'

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateGrossAmount(unitPrice: number, quantity: number) {
  return roundMoney(unitPrice * quantity)
}

export function calculateCommissionAmount(amount: number, commissionRateSnapshot: number) {
  return roundMoney(amount * (commissionRateSnapshot / 100))
}

export async function recalculateSaleProjectionTotals(
  client: PoolClient,
  saleId: string,
  updatedAt: string,
) {
  await client.query(
    `
      update sales_projection sp
      set total_amount = coalesce(items.total_amount, 0),
          status = case
            when sp.status = 'Cancelled' then sp.status
            when coalesce(items.subtotal_amount, 0) > 0
              and coalesce(items.total_refunded, 0) >= coalesce(items.subtotal_amount, 0)
              then 'Refunded'::sale_status
            when coalesce(items.total_refunded, 0) > 0
              then 'PartiallyRefunded'::sale_status
            else sp.status
          end,
          updated_at = $2
      from (
        select
          sale_id,
          coalesce(sum(case when status <> 'Removed' then unit_price * quantity else 0 end), 0) as subtotal_amount,
          coalesce(sum(case when status <> 'Removed' then refunded_amount else 0 end), 0) as total_refunded,
          coalesce(sum(case when status <> 'Removed' then amount else 0 end), 0) as total_amount
        from sale_items_projection
        where sale_id = $1
        group by sale_id
      ) items
      where sp.sale_id = items.sale_id
    `,
    [saleId, updatedAt],
  )
}

export async function recalculateWorkerEarnings(
  client: PoolClient,
  workerId: string,
  updatedAt: string,
) {
  const result = await client.query<{ paid_earnings: string | null }>(
    `
      select paid_earnings
      from worker_earnings_projection
      where worker_id = $1
    `,
    [workerId],
  )
  const paidEarnings = Number(result.rows[0]?.paid_earnings ?? 0)

  await client.query(
    `
      insert into worker_earnings_projection (
        worker_id,
        total_earnings,
        unpaid_earnings,
        paid_earnings,
        last_updated
      )
      select
        $1,
        coalesce(sum(case
          when sp.status in ('Completed', 'PartiallyRefunded', 'Refunded')
            and sip.status <> 'Removed'
            then sip.commission_amount
          else 0
        end), 0),
        greatest(coalesce(sum(case
          when sp.status in ('Completed', 'PartiallyRefunded', 'Refunded')
            and sip.status <> 'Removed'
            then sip.commission_amount
          else 0
        end), 0) - $2::numeric, 0),
        $2::numeric,
        $3
      from sale_items_projection sip
      inner join sales_projection sp on sp.sale_id = sip.sale_id
      where sip.worker_id = $1
      on conflict (worker_id)
      do update set
        total_earnings = excluded.total_earnings,
        unpaid_earnings = excluded.unpaid_earnings,
        paid_earnings = excluded.paid_earnings,
        last_updated = excluded.last_updated
    `,
    [workerId, paidEarnings, updatedAt],
  )
}

export async function incrementWorkerPaidEarnings(
  client: PoolClient,
  workerId: string,
  amount: number,
  updatedAt: string,
) {
  await client.query(
    `
      insert into worker_earnings_projection (
        worker_id,
        total_earnings,
        unpaid_earnings,
        paid_earnings,
        last_updated
      )
      values ($1, 0, 0, $2, $3)
      on conflict (worker_id)
      do update set
        paid_earnings = worker_earnings_projection.paid_earnings + excluded.paid_earnings,
        unpaid_earnings = greatest(
          worker_earnings_projection.total_earnings
            - (worker_earnings_projection.paid_earnings + excluded.paid_earnings),
          0
        ),
        last_updated = excluded.last_updated
    `,
    [workerId, amount, updatedAt],
  )
}

export async function markWorkerEarningsPaid(
  client: PoolClient,
  workerId: string,
  updatedAt: string,
) {
  await client.query(
    `
      insert into worker_earnings_projection (
        worker_id,
        total_earnings,
        unpaid_earnings,
        paid_earnings,
        last_updated
      )
      values ($1, 0, 0, 0, $2)
      on conflict (worker_id)
      do update set
        paid_earnings = worker_earnings_projection.total_earnings,
        unpaid_earnings = 0,
        last_updated = excluded.last_updated
    `,
    [workerId, updatedAt],
  )
}

export async function recalculateBranchRevenue(
  client: PoolClient,
  branchId: string,
  updatedAt: string,
) {
  await client.query(
    `
      insert into branch_revenue_projection (
        branch_id,
        total_revenue,
        total_refunds,
        net_revenue,
        updated_at
      )
      values (
        $1,
        coalesce((
          select sum(sip.unit_price * sip.quantity)
          from sale_items_projection sip
          inner join sales_projection sp on sp.sale_id = sip.sale_id
          where sp.branch_id = $1
            and sp.status in ('Completed', 'PartiallyRefunded', 'Refunded')
            and sip.status <> 'Removed'
        ), 0),
        coalesce((
          select sum(rp.amount)
          from refund_projection rp
          inner join sales_projection sp on sp.sale_id = rp.sale_id
          where sp.branch_id = $1
            and rp.status = 'Completed'
        ), 0),
        greatest(
          coalesce((
            select sum(sip.unit_price * sip.quantity)
            from sale_items_projection sip
            inner join sales_projection sp on sp.sale_id = sip.sale_id
            where sp.branch_id = $1
              and sp.status in ('Completed', 'PartiallyRefunded', 'Refunded')
              and sip.status <> 'Removed'
          ), 0)
          - coalesce((
            select sum(rp.amount)
            from refund_projection rp
            inner join sales_projection sp on sp.sale_id = rp.sale_id
            where sp.branch_id = $1
              and rp.status = 'Completed'
          ), 0),
          0
        ),
        $2
      )
      on conflict (branch_id)
      do update set
        total_revenue = excluded.total_revenue,
        total_refunds = excluded.total_refunds,
        net_revenue = excluded.net_revenue,
        updated_at = excluded.updated_at
    `,
    [branchId, updatedAt],
  )
}

export async function getSaleBranchId(client: PoolClient, saleId: string) {
  const result = await client.query<{ branch_id: string }>(
    `
      select branch_id
      from sales_projection
      where sale_id = $1
    `,
    [saleId],
  )

  return result.rows[0]?.branch_id
}

export async function getSaleIdForItem(client: PoolClient, saleItemId: string) {
  const result = await client.query<{ sale_id: string }>(
    `
      select sale_id
      from sale_items_projection
      where sale_item_id = $1
    `,
    [saleItemId],
  )

  return result.rows[0]?.sale_id
}

export function getRefundAwareItemStatus(amount: number, refundedAmount: number) {
  if (amount <= 0) {
    return SaleItemStatus.Refunded
  }

  return refundedAmount > 0 ? SaleItemStatus.PartiallyRefunded : SaleItemStatus.Active
}

export function isRevenueBearingSaleStatus(status: string) {
  return (
    status === SaleStatus.Completed ||
    status === SaleStatus.PartiallyRefunded ||
    status === SaleStatus.Refunded
  )
}

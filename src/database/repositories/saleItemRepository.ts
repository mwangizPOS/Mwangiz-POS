import type { DbSaleItemRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso, toNumber } from './helpers'

type SaleItemRow = Omit<
  DbSaleItemRow,
  | 'price'
  | 'commission_rate_snapshot'
  | 'worker_revenue'
  | 'salon_revenue'
  | 'refunded_amount'
  | 'created_at'
  | 'updated_at'
> & {
  price: string | number
  commission_rate_snapshot: string | number
  worker_revenue: string | number
  salon_revenue: string | number
  refunded_amount: string | number
  created_at: Date | string
  updated_at: Date | string
}

export class SaleItemRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<SaleItemRow>(
      'select * from sale_items where id = $1 limit 1',
      [id],
    )

    return result.rows[0] ? mapSaleItem(result.rows[0]) : undefined
  }

  async listBySaleId(saleId: EntityId) {
    const result = await resolveClient(this.client).query<SaleItemRow>(
      'select * from sale_items where sale_id = $1 order by created_at asc',
      [saleId],
    )

    return result.rows.map(mapSaleItem)
  }

  async save(row: DbSaleItemRow) {
    const result = await resolveClient(this.client).query<SaleItemRow>(
      `
        insert into sale_items (
          id,
          sale_id,
          sale_client_id,
          service_id,
          worker_id,
          quantity,
          price,
          commission_rate_snapshot,
          worker_revenue,
          salon_revenue,
          refunded_amount,
          status,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        on conflict (id)
        do update set
          sale_id = excluded.sale_id,
          sale_client_id = excluded.sale_client_id,
          service_id = excluded.service_id,
          worker_id = excluded.worker_id,
          quantity = excluded.quantity,
          price = excluded.price,
          commission_rate_snapshot = excluded.commission_rate_snapshot,
          worker_revenue = excluded.worker_revenue,
          salon_revenue = excluded.salon_revenue,
          refunded_amount = excluded.refunded_amount,
          status = excluded.status,
          updated_at = excluded.updated_at
        returning *
      `,
      [
        row.id,
        row.sale_id,
        row.sale_client_id,
        row.service_id,
        row.worker_id,
        row.quantity,
        row.price,
        row.commission_rate_snapshot,
        row.worker_revenue,
        row.salon_revenue,
        row.refunded_amount,
        row.status,
        row.created_at,
        row.updated_at,
      ],
    )

    return mapSaleItem(result.rows[0] as SaleItemRow)
  }
}

function mapSaleItem(row: SaleItemRow): DbSaleItemRow {
  return {
    ...row,
    price: toNumber(row.price),
    commission_rate_snapshot: toNumber(row.commission_rate_snapshot),
    worker_revenue: toNumber(row.worker_revenue),
    salon_revenue: toNumber(row.salon_revenue),
    refunded_amount: toNumber(row.refunded_amount),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

import type { DbSaleRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso, toNumber } from './helpers'

type SaleRow = Omit<
  DbSaleRow,
  'subtotal' | 'refund_amount' | 'total_amount' | 'created_at' | 'updated_at' | 'completed_at' | 'cancelled_at'
> & {
  subtotal: string | number
  refund_amount: string | number
  total_amount: string | number
  created_at: Date | string
  updated_at: Date | string
  completed_at: Date | string | null
  cancelled_at: Date | string | null
}

export class SalesRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<SaleRow>(
      'select * from sales where id = $1 limit 1',
      [id],
    )

    return result.rows[0] ? mapSale(result.rows[0]) : undefined
  }

  async findBySaleNumber(saleNumber: string) {
    const result = await resolveClient(this.client).query<SaleRow>(
      'select * from sales where sale_number = $1 limit 1',
      [saleNumber],
    )

    return result.rows[0] ? mapSale(result.rows[0]) : undefined
  }

  async save(row: DbSaleRow) {
    const result = await resolveClient(this.client).query<SaleRow>(
      `
        insert into sales (
          id,
          sale_number,
          branch_id,
          status,
          payment_method,
          payment_status,
          subtotal,
          refund_amount,
          total_amount,
          sync_status,
          created_by,
          created_at,
          updated_at,
          completed_at,
          cancelled_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        on conflict (id)
        do update set
          sale_number = excluded.sale_number,
          branch_id = excluded.branch_id,
          status = excluded.status,
          payment_method = excluded.payment_method,
          payment_status = excluded.payment_status,
          subtotal = excluded.subtotal,
          refund_amount = excluded.refund_amount,
          total_amount = excluded.total_amount,
          sync_status = excluded.sync_status,
          created_by = excluded.created_by,
          updated_at = excluded.updated_at,
          completed_at = excluded.completed_at,
          cancelled_at = excluded.cancelled_at
        returning *
      `,
      [
        row.id,
        row.sale_number,
        row.branch_id,
        row.status,
        row.payment_method,
        row.payment_status,
        row.subtotal,
        row.refund_amount,
        row.total_amount,
        row.sync_status,
        row.created_by,
        row.created_at,
        row.updated_at,
        row.completed_at,
        row.cancelled_at,
      ],
    )

    return mapSale(result.rows[0] as SaleRow)
  }
}

function mapSale(row: SaleRow): DbSaleRow {
  return {
    ...row,
    subtotal: toNumber(row.subtotal),
    refund_amount: toNumber(row.refund_amount),
    total_amount: toNumber(row.total_amount),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    completed_at: row.completed_at ? toIso(row.completed_at) : null,
    cancelled_at: row.cancelled_at ? toIso(row.cancelled_at) : null,
  }
}

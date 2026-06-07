import type { DbRefundRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso, toNumber } from './helpers'

type RefundRow = Omit<
  DbRefundRow,
  'refund_amount' | 'processed_amount' | 'created_at' | 'updated_at'
> & {
  refund_amount: string | number
  processed_amount: string | number
  created_at: Date | string
  updated_at: Date | string
}

export class RefundRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<RefundRow>(
      'select * from refunds where id = $1 limit 1',
      [id],
    )

    return result.rows[0] ? mapRefund(result.rows[0]) : undefined
  }

  async listBySaleId(saleId: EntityId) {
    const result = await resolveClient(this.client).query<RefundRow>(
      'select * from refunds where sale_id = $1 order by created_at asc',
      [saleId],
    )

    return result.rows.map(mapRefund)
  }

  async save(row: DbRefundRow) {
    const result = await resolveClient(this.client).query<RefundRow>(
      `
        insert into refunds (
          id,
          sale_id,
          sale_item_id,
          refund_target,
          refund_type,
          refund_amount,
          processed_amount,
          reason,
          status,
          requested_by,
          approved_by,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        on conflict (id)
        do update set
          sale_id = excluded.sale_id,
          sale_item_id = excluded.sale_item_id,
          refund_target = excluded.refund_target,
          refund_type = excluded.refund_type,
          refund_amount = excluded.refund_amount,
          processed_amount = excluded.processed_amount,
          reason = excluded.reason,
          status = excluded.status,
          requested_by = excluded.requested_by,
          approved_by = excluded.approved_by,
          updated_at = excluded.updated_at
        returning *
      `,
      [
        row.id,
        row.sale_id,
        row.sale_item_id,
        row.refund_target,
        row.refund_type,
        row.refund_amount,
        row.processed_amount,
        row.reason,
        row.status,
        row.requested_by,
        row.approved_by,
        row.created_at,
        row.updated_at,
      ],
    )

    return mapRefund(result.rows[0] as RefundRow)
  }
}

function mapRefund(row: RefundRow): DbRefundRow {
  return {
    ...row,
    refund_amount: toNumber(row.refund_amount),
    processed_amount: toNumber(row.processed_amount),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

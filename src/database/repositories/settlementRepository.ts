import type { DbWorkerSettlementRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso, toNumber } from './helpers'

type SettlementRow = Omit<
  DbWorkerSettlementRow,
  | 'total_earned'
  | 'paid_amount'
  | 'unpaid_amount'
  | 'period_start'
  | 'period_end'
  | 'paid_at'
  | 'created_at'
  | 'updated_at'
> & {
  total_earned: string | number
  paid_amount: string | number
  unpaid_amount: string | number
  period_start: Date | string
  period_end: Date | string
  paid_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

export class SettlementRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<SettlementRow>(
      'select * from worker_settlements where id = $1 limit 1',
      [id],
    )

    return result.rows[0] ? mapSettlement(result.rows[0]) : undefined
  }

  async listByWorkerId(workerId: EntityId) {
    const result = await resolveClient(this.client).query<SettlementRow>(
      'select * from worker_settlements where worker_id = $1 order by created_at desc',
      [workerId],
    )

    return result.rows.map(mapSettlement)
  }

  async save(row: Omit<DbWorkerSettlementRow, 'unpaid_amount'>) {
    const result = await resolveClient(this.client).query<SettlementRow>(
      `
        insert into worker_settlements (
          id,
          worker_id,
          branch_id,
          period_start,
          period_end,
          total_earned,
          paid_amount,
          paid_by,
          paid_at,
          status,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        on conflict (id)
        do update set
          worker_id = excluded.worker_id,
          branch_id = excluded.branch_id,
          period_start = excluded.period_start,
          period_end = excluded.period_end,
          total_earned = excluded.total_earned,
          paid_amount = excluded.paid_amount,
          paid_by = excluded.paid_by,
          paid_at = excluded.paid_at,
          status = excluded.status,
          updated_at = excluded.updated_at
        returning *
      `,
      [
        row.id,
        row.worker_id,
        row.branch_id,
        row.period_start,
        row.period_end,
        row.total_earned,
        row.paid_amount,
        row.paid_by,
        row.paid_at,
        row.status,
        row.created_at,
        row.updated_at,
      ],
    )

    return mapSettlement(result.rows[0] as SettlementRow)
  }
}

function mapSettlement(row: SettlementRow): DbWorkerSettlementRow {
  return {
    ...row,
    total_earned: toNumber(row.total_earned),
    paid_amount: toNumber(row.paid_amount),
    unpaid_amount: toNumber(row.unpaid_amount),
    period_start: toIso(row.period_start),
    period_end: toIso(row.period_end),
    paid_at: row.paid_at ? toIso(row.paid_at) : null,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

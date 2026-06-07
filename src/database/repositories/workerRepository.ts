import type { DbWorkerRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso } from './helpers'

interface WorkerRow extends Omit<DbWorkerRow, 'created_at' | 'updated_at'> {
  created_at: Date | string
  updated_at: Date | string
}

export class WorkerRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<WorkerRow>(
      'select * from workers where id = $1 limit 1',
      [id],
    )

    return result.rows[0] ? mapWorker(result.rows[0]) : undefined
  }

  async listByBranchId(branchId: EntityId) {
    const result = await resolveClient(this.client).query<WorkerRow>(
      'select * from workers where branch_id = $1 order by full_name asc',
      [branchId],
    )

    return result.rows.map(mapWorker)
  }

  async save(row: DbWorkerRow) {
    const result = await resolveClient(this.client).query<WorkerRow>(
      `
        insert into workers (
          id, branch_id, full_name, phone, skills, active, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (id)
        do update set
          branch_id = excluded.branch_id,
          full_name = excluded.full_name,
          phone = excluded.phone,
          skills = excluded.skills,
          active = excluded.active,
          updated_at = excluded.updated_at
        returning *
      `,
      [
        row.id,
        row.branch_id,
        row.full_name,
        row.phone,
        row.skills,
        row.active,
        row.created_at,
        row.updated_at,
      ],
    )

    return mapWorker(result.rows[0] as WorkerRow)
  }
}

function mapWorker(row: WorkerRow): DbWorkerRow {
  return {
    ...row,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

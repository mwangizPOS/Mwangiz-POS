import type { DbBranchRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso } from './helpers'

interface BranchRow extends Omit<DbBranchRow, 'created_at' | 'updated_at'> {
  created_at: Date | string
  updated_at: Date | string
}

export class BranchRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<BranchRow>(
      'select * from branches where id = $1 limit 1',
      [id],
    )

    return result.rows[0] ? mapBranch(result.rows[0]) : undefined
  }

  async listActive() {
    const result = await resolveClient(this.client).query<BranchRow>(
      'select * from branches where active = true order by name asc',
    )

    return result.rows.map(mapBranch)
  }

  async save(row: DbBranchRow) {
    const result = await resolveClient(this.client).query<BranchRow>(
      `
        insert into branches (
          id, name, code, address, manager_id, active, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (id)
        do update set
          name = excluded.name,
          code = excluded.code,
          address = excluded.address,
          manager_id = excluded.manager_id,
          active = excluded.active,
          updated_at = excluded.updated_at
        returning *
      `,
      [
        row.id,
        row.name,
        row.code,
        row.address,
        row.manager_id,
        row.active,
        row.created_at,
        row.updated_at,
      ],
    )

    return mapBranch(result.rows[0] as BranchRow)
  }
}

function mapBranch(row: BranchRow): DbBranchRow {
  return {
    ...row,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

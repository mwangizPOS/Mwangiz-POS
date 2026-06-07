import type { DbServiceRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso, toNumber } from './helpers'

type ServiceRow = Omit<
  DbServiceRow,
  'default_price' | 'commission_percent' | 'created_at' | 'updated_at'
> & {
  default_price: string | number
  commission_percent: string | number
  created_at: Date | string
  updated_at: Date | string
}

export class ServiceRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<ServiceRow>(
      'select * from services where id = $1 limit 1',
      [id],
    )

    return result.rows[0] ? mapService(result.rows[0]) : undefined
  }

  async listActive() {
    const result = await resolveClient(this.client).query<ServiceRow>(
      'select * from services where active = true order by name asc',
    )

    return result.rows.map(mapService)
  }

  async save(row: DbServiceRow) {
    const result = await resolveClient(this.client).query<ServiceRow>(
      `
        insert into services (
          id, name, default_price, commission_percent, active, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id)
        do update set
          name = excluded.name,
          default_price = excluded.default_price,
          commission_percent = excluded.commission_percent,
          active = excluded.active,
          updated_at = excluded.updated_at
        returning *
      `,
      [
        row.id,
        row.name,
        row.default_price,
        row.commission_percent,
        row.active,
        row.created_at,
        row.updated_at,
      ],
    )

    return mapService(result.rows[0] as ServiceRow)
  }
}

function mapService(row: ServiceRow): DbServiceRow {
  return {
    ...row,
    default_price: toNumber(row.default_price),
    commission_percent: toNumber(row.commission_percent),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

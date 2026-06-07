import type { SystemRole } from '@/domain/enums'
import type { DbUserRow } from '@/types/database'
import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso } from './helpers'

interface UserRow extends Omit<DbUserRow, 'created_at' | 'updated_at'> {
  created_at: Date | string
  updated_at: Date | string
}

export interface CreateUserInput {
  email: string
  passwordHash: string
  role: SystemRole
  active?: boolean
}

export class UserRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<UserRow>(
      `
        select id, email, password_hash, role, active, created_at, updated_at
        from users
        where id = $1
        limit 1
      `,
      [id],
    )

    return result.rows[0] ? mapUser(result.rows[0]) : undefined
  }

  async findByEmail(email: string) {
    const result = await resolveClient(this.client).query<UserRow>(
      `
        select id, email, password_hash, role, active, created_at, updated_at
        from users
        where lower(email::text) = lower($1)
        limit 1
      `,
      [email],
    )

    return result.rows[0] ? mapUser(result.rows[0]) : undefined
  }

  async create(input: CreateUserInput) {
    const result = await resolveClient(this.client).query<UserRow>(
      `
        insert into users (email, password_hash, role, active)
        values ($1, $2, $3, $4)
        returning id, email, password_hash, role, active, created_at, updated_at
      `,
      [input.email, input.passwordHash, input.role, input.active ?? true],
    )

    return mapUser(result.rows[0] as UserRow)
  }
}

function mapUser(row: UserRow): DbUserRow {
  return {
    ...row,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

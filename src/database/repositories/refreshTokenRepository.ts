import type { EntityId } from '@/types/primitives'
import type { DatabaseClient } from '../client'
import { resolveClient, toIso } from './helpers'

export interface RefreshTokenRecord {
  id: EntityId
  userId: EntityId
  tokenHash: string
  expiresAt: string
  createdAt: string
  revokedAt: string | null
  replacedByTokenId: EntityId | null
}

interface RefreshTokenRow {
  id: EntityId
  user_id: EntityId
  token_hash: string
  expires_at: Date | string
  created_at: Date | string
  revoked_at: Date | string | null
  replaced_by_token_id: EntityId | null
}

export class RefreshTokenRepository {
  private readonly client?: DatabaseClient

  constructor(client?: DatabaseClient) {
    this.client = client
  }

  async create(record: RefreshTokenRecord) {
    await resolveClient(this.client).query(
      `
        insert into auth_refresh_tokens (
          id,
          user_id,
          token_hash,
          expires_at,
          created_at,
          revoked_at,
          replaced_by_token_id
        )
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        record.id,
        record.userId,
        record.tokenHash,
        record.expiresAt,
        record.createdAt,
        record.revokedAt,
        record.replacedByTokenId,
      ],
    )
  }

  async findById(id: EntityId) {
    const result = await resolveClient(this.client).query<RefreshTokenRow>(
      `
        select id, user_id, token_hash, expires_at, created_at, revoked_at, replaced_by_token_id
        from auth_refresh_tokens
        where id = $1
        limit 1
      `,
      [id],
    )

    return result.rows[0] ? mapRefreshToken(result.rows[0]) : undefined
  }

  async revoke(id: EntityId, replacedByTokenId?: EntityId | null) {
    await resolveClient(this.client).query(
      `
        update auth_refresh_tokens
        set revoked_at = coalesce(revoked_at, now()),
            replaced_by_token_id = coalesce($2, replaced_by_token_id)
        where id = $1
      `,
      [id, replacedByTokenId ?? null],
    )
  }

  async revokeAllForUser(userId: EntityId) {
    await resolveClient(this.client).query(
      `
        update auth_refresh_tokens
        set revoked_at = coalesce(revoked_at, now())
        where user_id = $1
          and revoked_at is null
      `,
      [userId],
    )
  }
}

function mapRefreshToken(row: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: toIso(row.expires_at),
    createdAt: toIso(row.created_at),
    revokedAt: row.revoked_at ? toIso(row.revoked_at) : null,
    replacedByTokenId: row.replaced_by_token_id,
  }
}

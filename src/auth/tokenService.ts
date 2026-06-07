import { createHash, randomBytes } from 'node:crypto'
import * as jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { env, requireConfig } from '@/config/env'
import type { AuthenticatedUser, AccessTokenClaims } from './types'

export interface RefreshTokenSecret {
  id: string
  token: string
  tokenHash: string
  expiresAt: string
}

export class TokenService {
  private readonly jwtSecret: string
  private readonly accessTokenExpiresIn: string
  private readonly refreshTokenDays: number

  constructor(options: {
    jwtSecret?: string
    accessTokenExpiresIn?: string
    refreshTokenDays?: number
  } = {}) {
    this.jwtSecret = requireConfig(options.jwtSecret ?? env.auth.jwtSecret, 'JWT_SECRET')
    this.accessTokenExpiresIn = options.accessTokenExpiresIn ?? env.auth.accessTokenExpiresIn
    this.refreshTokenDays = options.refreshTokenDays ?? env.auth.refreshTokenDays
  }

  createAccessToken(user: AuthenticatedUser) {
    const claims: AccessTokenClaims = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    }

    return jwt.sign(claims, this.jwtSecret, {
      expiresIn: this.accessTokenExpiresIn,
    } as jwt.SignOptions)
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    const decoded = jwt.verify(token, this.jwtSecret) as Partial<AccessTokenClaims>

    if (
      decoded.type !== 'access' ||
      !decoded.sub ||
      !decoded.email ||
      !decoded.role
    ) {
      throw new Error('Invalid access token.')
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    }
  }

  createRefreshToken(): RefreshTokenSecret {
    const id = uuidv4()
    const secret = randomBytes(48).toString('base64url')
    const expiresAt = new Date(
      Date.now() + this.refreshTokenDays * 24 * 60 * 60 * 1_000,
    ).toISOString()

    return {
      id,
      token: `${id}.${secret}`,
      tokenHash: hashRefreshTokenSecret(secret),
      expiresAt,
    }
  }

  parseRefreshToken(token: string) {
    const [id, secret] = token.split('.')

    if (!id || !secret) {
      throw new Error('Invalid refresh token.')
    }

    return {
      id,
      tokenHash: hashRefreshTokenSecret(secret),
    }
  }

  getAccessTokenExpiresIn() {
    return this.accessTokenExpiresIn
  }
}

function hashRefreshTokenSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex')
}

export const tokenService = new TokenService()

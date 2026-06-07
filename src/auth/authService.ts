import { v4 as uuidv4 } from 'uuid'
import { UserRepository, RefreshTokenRepository } from '@/database/repositories'
import { withTransaction } from '@/database/transactions'
import type { EntityId } from '@/types/primitives'
import { verifyPassword } from './password'
import { tokenService, type TokenService } from './tokenService'
import type { AuthResponse, AuthenticatedUser } from './types'

export class AuthService {
  private readonly users: UserRepository
  private readonly refreshTokens: RefreshTokenRepository
  private readonly tokens: TokenService

  constructor(
    users = new UserRepository(),
    refreshTokens = new RefreshTokenRepository(),
    tokens = tokenService,
  ) {
    this.users = users
    this.refreshTokens = refreshTokens
    this.tokens = tokens
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.users.findByEmail(email)

    if (!user || !user.active) {
      throw new Error('Invalid email or password.')
    }

    const passwordMatches = await verifyPassword(password, user.password_hash)

    if (!passwordMatches) {
      throw new Error('Invalid email or password.')
    }

    return this.issueTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const parsed = this.tokens.parseRefreshToken(refreshToken)
    const existing = await this.refreshTokens.findById(parsed.id)

    if (!existing || existing.revokedAt) {
      throw new Error('Refresh token is invalid.')
    }

    if (existing.tokenHash !== parsed.tokenHash) {
      throw new Error('Refresh token is invalid.')
    }

    if (Date.parse(existing.expiresAt) <= Date.now()) {
      await this.refreshTokens.revoke(existing.id)
      throw new Error('Refresh token has expired.')
    }

    const user = await this.users.findById(existing.userId)

    if (!user || !user.active) {
      throw new Error('Refresh token user is inactive.')
    }

    return withTransaction(async (client) => {
      const scopedRefreshTokens = new RefreshTokenRepository(client)
      const scopedAuth = new AuthService(
        new UserRepository(client),
        scopedRefreshTokens,
        this.tokens,
      )
      const response = await scopedAuth.issueTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      })
      const replacementId = scopedAuth.tokens.parseRefreshToken(response.tokens.refreshToken).id

      await scopedRefreshTokens.revoke(existing.id, replacementId)

      return response
    })
  }

  async logout(options: { refreshToken?: string; userId?: EntityId }) {
    if (options.refreshToken) {
      const parsed = this.tokens.parseRefreshToken(options.refreshToken)
      await this.refreshTokens.revoke(parsed.id)
      return
    }

    if (options.userId) {
      await this.refreshTokens.revokeAllForUser(options.userId)
    }
  }

  verifyAccessToken(token: string) {
    return this.tokens.verifyAccessToken(token)
  }

  private async issueTokenPair(user: AuthenticatedUser): Promise<AuthResponse> {
    const refreshToken = this.tokens.createRefreshToken()

    await this.refreshTokens.create({
      id: refreshToken.id,
      userId: user.id,
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      createdAt: new Date().toISOString(),
      revokedAt: null,
      replacedByTokenId: null,
    })

    return {
      user,
      tokens: {
        accessToken: this.tokens.createAccessToken(user),
        refreshToken: refreshToken.token,
        accessTokenExpiresIn: this.tokens.getAccessTokenExpiresIn(),
        refreshTokenExpiresAt: refreshToken.expiresAt,
      },
    }
  }
}

export const authService = new AuthService()

export function createAuthRequestId() {
  return uuidv4()
}

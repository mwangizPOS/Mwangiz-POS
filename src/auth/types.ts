import type { SystemRole } from '@/domain/enums'
import type { EntityId } from '@/types/primitives'
import type { Request } from 'express'

export interface AuthenticatedUser {
  id: EntityId
  email: string
  role: SystemRole
}

export interface AccessTokenClaims {
  sub: EntityId
  email: string
  role: SystemRole
  type: 'access'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken?: string
}

export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: string
  refreshTokenExpiresAt: string
}

export interface AuthResponse {
  user: AuthenticatedUser
  tokens: AuthTokenPair
}

export type AuthenticatedRequest = Request & {
  auth?: AuthenticatedUser
}

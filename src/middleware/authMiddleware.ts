import type { NextFunction, Request, Response } from 'express'
import type { AuthenticatedRequest } from '@/auth'
import type { SystemRole } from '@/domain/enums'
import { authService } from '@/auth'
import { ApiError } from './errors'

export function authenticateJwt(request: Request, _response: Response, next: NextFunction) {
  const token = extractBearerToken(request)

  if (!token) {
    throw new ApiError(401, 'Unauthorized', 'A bearer access token is required.')
  }

  try {
    ;(request as AuthenticatedRequest).auth = authService.verifyAccessToken(token)
    next()
  } catch {
    throw new ApiError(401, 'InvalidAccessToken', 'Access token is invalid or expired.')
  }
}

export function optionalAuthenticateJwt(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const token = extractBearerToken(request)

  if (!token) {
    next()
    return
  }

  try {
    ;(request as AuthenticatedRequest).auth = authService.verifyAccessToken(token)
    next()
  } catch {
    throw new ApiError(401, 'InvalidAccessToken', 'Access token is invalid or expired.')
  }
}

export function requireRole(...roles: SystemRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const auth = (request as AuthenticatedRequest).auth

    if (!auth) {
      throw new ApiError(401, 'Unauthorized', 'Authentication is required.')
    }

    if (!roles.includes(auth.role)) {
      throw new ApiError(403, 'Forbidden', 'Your role cannot perform this action.')
    }

    next()
  }
}

function extractBearerToken(request: Request) {
  return request.header('authorization')?.replace(/^Bearer\s+/i, '').trim()
}

import type { NextFunction, Request, Response } from 'express'
import { env, isProduction } from '@/config/env'
import { ApiError } from './errors'

export function apiKeyAuth(request: Request, _response: Response, next: NextFunction) {
  if (!env.backendApiKey && !isProduction()) {
    next()
    return
  }

  if (!env.backendApiKey) {
    throw new ApiError(500, 'ApiKeyNotConfigured', 'BACKEND_API_KEY is required in production.')
  }

  const bearerToken = request.header('authorization')?.replace(/^Bearer\s+/i, '')
  const apiKey = request.header('x-api-key') ?? bearerToken

  if (apiKey !== env.backendApiKey) {
    throw new ApiError(401, 'Unauthorized', 'A valid API key is required.')
  }

  next()
}

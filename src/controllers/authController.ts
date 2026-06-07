import type { Request, Response } from 'express'
import { authService, type AuthenticatedRequest } from '@/auth'
import {
  loginRequestSchema,
  logoutRequestSchema,
  refreshTokenRequestSchema,
} from '@/validation/authSchemas'

export async function login(request: Request, response: Response) {
  const body = loginRequestSchema.parse(request.body)
  const result = await authService.login(body.email, body.password)

  response.status(200).json({
    success: true,
    data: result,
  })
}

export async function refreshToken(request: Request, response: Response) {
  const body = refreshTokenRequestSchema.parse(request.body)
  const result = await authService.refresh(body.refreshToken)

  response.status(200).json({
    success: true,
    data: result,
  })
}

export async function logout(request: Request, response: Response) {
  const body = logoutRequestSchema.parse(request.body ?? {})

  await authService.logout({
    refreshToken: body.refreshToken,
    userId: (request as AuthenticatedRequest).auth?.id,
  })

  response.status(200).json({
    success: true,
    data: {
      loggedOut: true,
    },
  })
}

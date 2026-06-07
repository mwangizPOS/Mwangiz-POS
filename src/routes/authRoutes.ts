import { Router } from 'express'
import { login, logout, refreshToken } from '@/controllers/authController'
import { optionalAuthenticateJwt } from '@/middleware/authMiddleware'
import { asyncHandler } from '@/middleware/errors'

export const authRoutes = Router()

authRoutes.post('/login', asyncHandler(login))
authRoutes.post('/refresh', asyncHandler(refreshToken))
authRoutes.post('/logout', optionalAuthenticateJwt, asyncHandler(logout))

import { Router } from 'express'
import { initiateStkPush, receiveMpesaCallback } from '@/controllers/mpesaController'
import { SystemRole } from '@/domain/enums'
import { apiKeyAuth } from '@/middleware/apiKeyAuth'
import { authenticateJwt, requireRole } from '@/middleware/authMiddleware'
import { asyncHandler } from '@/middleware/errors'

export const mpesaRoutes = Router()

mpesaRoutes.post(
  '/stk-push',
  apiKeyAuth,
  authenticateJwt,
  requireRole(SystemRole.SuperAdmin, SystemRole.BranchManager, SystemRole.Cashier),
  asyncHandler(initiateStkPush),
)
mpesaRoutes.post('/callback', asyncHandler(receiveMpesaCallback))

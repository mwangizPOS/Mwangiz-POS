import { Router } from 'express'
import { initiateStkPush, receiveMpesaCallback } from '@/controllers/mpesaController'
import { apiKeyAuth } from '@/middleware/apiKeyAuth'
import { asyncHandler } from '@/middleware/errors'

export const mpesaRoutes = Router()

mpesaRoutes.post('/stk-push', apiKeyAuth, asyncHandler(initiateStkPush))
mpesaRoutes.post('/callback', asyncHandler(receiveMpesaCallback))

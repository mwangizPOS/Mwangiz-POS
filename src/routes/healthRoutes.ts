import { Router } from 'express'
import { healthCheck } from '@/controllers/healthController'
import { asyncHandler } from '@/middleware/errors'

export const healthRoutes = Router()

healthRoutes.get('/health', asyncHandler(healthCheck))

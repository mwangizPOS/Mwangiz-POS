import { Router } from 'express'
import { SystemRole } from '@/domain/enums'
import { apiKeyAuth } from '@/middleware/apiKeyAuth'
import { authenticateJwt, requireRole } from '@/middleware/authMiddleware'
import { authRoutes } from './authRoutes'
import { eventsRoutes } from './eventsRoutes'
import { healthRoutes } from './healthRoutes'
import { mpesaRoutes } from './mpesaRoutes'
import { syncRoutes } from './syncRoutes'

export const routes = Router()
const authenticatedOperator = [
  authenticateJwt,
  requireRole(SystemRole.SuperAdmin, SystemRole.BranchManager, SystemRole.Cashier),
]

routes.use(healthRoutes)
routes.use('/api/auth', authRoutes)
routes.use('/api/events', apiKeyAuth, authenticatedOperator, eventsRoutes)
routes.use('/api/mpesa', mpesaRoutes)
routes.use('/api/sync', apiKeyAuth, authenticatedOperator, syncRoutes)

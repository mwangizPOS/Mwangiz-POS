import { Router } from 'express'
import { apiKeyAuth } from '@/middleware/apiKeyAuth'
import { eventsRoutes } from './eventsRoutes'
import { healthRoutes } from './healthRoutes'
import { mpesaRoutes } from './mpesaRoutes'
import { syncRoutes } from './syncRoutes'

export const routes = Router()

routes.use(healthRoutes)
routes.use('/api/events', apiKeyAuth, eventsRoutes)
routes.use('/api/mpesa', mpesaRoutes)
routes.use('/api/sync', apiKeyAuth, syncRoutes)

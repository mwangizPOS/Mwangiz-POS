import { Router } from 'express'
import { ingestEvent } from '@/controllers/eventsController'
import { asyncHandler } from '@/middleware/errors'

export const eventsRoutes = Router()

eventsRoutes.post('/', asyncHandler(ingestEvent))

import { Router } from 'express'
import { retrySyncBatch } from '@/controllers/syncController'
import { asyncHandler } from '@/middleware/errors'

export const syncRoutes = Router()

syncRoutes.post('/retry', asyncHandler(retrySyncBatch))

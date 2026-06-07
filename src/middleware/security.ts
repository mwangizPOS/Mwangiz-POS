import cors from 'cors'
import helmet from 'helmet'
import type { Express } from 'express'
import { env } from '@/config/env'
import { ApiError } from './errors'

export function applySecurityMiddleware(app: Express) {
  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        callback(new ApiError(403, 'CorsOriginRejected', 'Origin is not allowed.'))
      },
      credentials: true,
    }),
  )
}

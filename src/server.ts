import express from 'express'
import { env } from '@/config/env'
import { errorHandler } from '@/middleware/errors'
import { applySecurityMiddleware } from '@/middleware/security'
import { routes } from '@/routes'

interface RawBodyRequest extends express.Request {
  rawBody?: string
}

export function createServer() {
  const app = express()

  applySecurityMiddleware(app)
  app.use(
    express.json({
      limit: '1mb',
      verify(request: RawBodyRequest, _response, buffer) {
        request.rawBody = buffer.toString('utf8')
      },
    }),
  )
  app.use(routes)
  app.use(errorHandler)

  return app
}

const app = createServer()

app.listen(env.port, () => {
  console.log(`MWANGI'Z Salon POS API listening on port ${env.port}`)
})

import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import type { JsonObject } from '@/types/primitives'

export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: JsonObject

  constructor(statusCode: number, code: string, message: string, details?: JsonObject) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next)
  }
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  void next

  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    })
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: 'ValidationError',
        message: 'Request payload failed validation.',
        details: {
          issues: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
    })
    return
  }

  const message = error instanceof Error ? error.message : 'Unknown server error.'

  response.status(500).json({
    success: false,
    error: {
      code: 'InternalServerError',
      message,
    },
  })
}

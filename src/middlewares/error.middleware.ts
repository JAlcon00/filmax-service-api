import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

import { HttpError } from '../utils/errors.js'

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ message: error.message })
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: 'Datos de entrada inválidos',
      issues: error.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    })
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error'

  response.status(500).json({
    message
  })
}
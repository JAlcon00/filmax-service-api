import type { NextFunction, Request, Response } from 'express'

export const notFoundHandler = (
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  response.status(404).json({ message: 'Route not found' })
}
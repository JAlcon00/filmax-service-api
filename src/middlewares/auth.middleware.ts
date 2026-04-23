import type { NextFunction, Request, Response } from 'express'

export const authMiddleware = (
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  response.status(501).json({
    message: 'Auth middleware not implemented yet'
  })
}
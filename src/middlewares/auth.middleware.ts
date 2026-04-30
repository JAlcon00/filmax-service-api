import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'

import { env } from '../config/env.js'
import { HttpError } from '../utils/errors.js'

export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    name?: string
  }
}

export const authMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Se requiere token de autorización')
  }

  const token = authHeader.split(' ')[1]

  let payload: JwtPayload
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (typeof decoded === 'string') {
      throw new Error('Token inválido')
    }
    payload = decoded
  } catch {
    throw new HttpError(401, 'Token inválido')
  }

  if (!payload.sub || !payload.email) {
    throw new HttpError(401, 'Token inválido')
  }

  ;(request as AuthenticatedRequest).user = {
    id: String(payload.sub),
    email: String(payload.email),
    name: typeof payload.name === 'string' ? payload.name : undefined
  }

  next()
}
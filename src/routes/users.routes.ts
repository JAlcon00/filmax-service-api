import type { Request, Response } from 'express'
import { Router } from 'express'

import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'

export const usersRouter = Router()

usersRouter.get('/status', (_request, response) => {
  response.json({ module: 'users', status: 'scaffold-ready' })
})

usersRouter.get('/me', authMiddleware, (request: Request, response: Response) => {
  const authRequest = request as AuthenticatedRequest

  response.json({
    user: authRequest.user
  })
})
import { Router } from 'express'

export const usersRouter = Router()

usersRouter.get('/status', (_request, response) => {
  response.json({ module: 'users', status: 'scaffold-ready' })
})
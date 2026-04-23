import { Router } from 'express'

export const ratingsRouter = Router()

ratingsRouter.get('/status', (_request, response) => {
  response.json({ module: 'ratings', status: 'scaffold-ready' })
})
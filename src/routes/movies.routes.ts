import { Router } from 'express'

export const moviesRouter = Router()

moviesRouter.get('/status', (_request, response) => {
  response.json({ module: 'movies', status: 'scaffold-ready' })
})
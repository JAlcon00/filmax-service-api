import { Router } from 'express'

import { getCatalogController } from '../modules/movies/movies.controller.js'
import { asyncHandler } from '../utils/async-handler.js'

export const moviesRouter = Router()

moviesRouter.get('/status', (_request, response) => {
  response.json({ module: 'movies', status: 'scaffold-ready' })
})

moviesRouter.get('/search', asyncHandler(getCatalogController))
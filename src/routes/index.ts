import { Router } from 'express'

import { authRouter } from './auth.routes.js'
import { listsRouter } from './lists.routes.js'
import { moviesRouter } from './movies.routes.js'
import { ratingsRouter } from './ratings.routes.js'
import { usersRouter } from './users.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/movies', moviesRouter)
apiRouter.use('/ratings', ratingsRouter)
apiRouter.use('/lists', listsRouter)
apiRouter.use('/users', usersRouter)
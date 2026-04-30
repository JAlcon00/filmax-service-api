import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { errorHandler } from './middlewares/error.middleware.js'
import { notFoundHandler } from './middlewares/not-found.middleware.js'
import { apiRouter } from './routes/index.js'

export const createServer = () => {
  const app = express()

  app.set('trust proxy', 1)

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100
    })
  )

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' })
  })

  app.use('/api', apiRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
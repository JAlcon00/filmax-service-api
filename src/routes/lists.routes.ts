import { Router } from 'express'

export const listsRouter = Router()

listsRouter.get('/status', (_request, response) => {
  response.json({ module: 'lists', status: 'scaffold-ready' })
})
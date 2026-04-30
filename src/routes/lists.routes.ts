import { Router } from 'express'

import { asyncHandler } from '../utils/async-handler.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import {
  addListItemController,
  createListController,
  getListItemsController,
  removeListItemController
} from '../modules/lists/lists.controller.js'

export const listsRouter = Router()

listsRouter.post('/', authMiddleware, asyncHandler(createListController))
listsRouter.get('/:type', authMiddleware, asyncHandler(getListItemsController))
listsRouter.post('/:type/items', authMiddleware, asyncHandler(addListItemController))
listsRouter.delete('/:type/items/:contentId', authMiddleware, asyncHandler(removeListItemController))
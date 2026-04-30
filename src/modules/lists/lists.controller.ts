import type { Request, Response } from 'express'

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware.js'
import {
  listItemCreateRequestSchema,
  listsByTypeParamsSchema,
  listsCreateRequestSchema
} from '../../contracts/api.contracts.js'
import {
  addItemToList,
  createList,
  getListByType,
  removeItemFromList
} from './lists.service.js'

export const createListController = async (request: Request, response: Response) => {
  const authRequest = request as AuthenticatedRequest
  const payload = listsCreateRequestSchema.parse(request.body)

  const list = await createList(authRequest.user.id, payload)

  response.status(201).json(list)
}

export const getListItemsController = async (request: Request, response: Response) => {
  const authRequest = request as AuthenticatedRequest
  const params = listsByTypeParamsSchema.parse(request.params)

  const list = await getListByType(authRequest.user.id, params.type)

  response.status(200).json(list)
}

export const addListItemController = async (request: Request, response: Response) => {
  const authRequest = request as AuthenticatedRequest
  const params = listsByTypeParamsSchema.parse(request.params)
  const payload = listItemCreateRequestSchema.parse(request.body)

  const item = await addItemToList(authRequest.user.id, params.type, payload)

  response.status(201).json(item)
}

export const removeListItemController = async (request: Request, response: Response) => {
  const authRequest = request as AuthenticatedRequest
  const params = listsByTypeParamsSchema.parse(request.params)
  const contentId = String(request.params.contentId || '').trim()

  if (!contentId) {
    response.status(400).json({ message: 'El contentId es requerido' })
    return
  }

  await removeItemFromList(authRequest.user.id, params.type, contentId)

  response.status(204).end()
}

import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware.js'
import { commentsService } from './comments.service.js'
import { commentCreateRequestSchema, commentUpdateRequestSchema } from '../../contracts/api.contracts.js'
import { asyncHandler } from '../../utils/async-handler.js'

export const createCommentController = asyncHandler(async (req: Request, res: Response) => {
  const authRequest = req as AuthenticatedRequest
  const validated = commentCreateRequestSchema.parse(req.body)
  const userId = authRequest.user.id

  const result = await commentsService.createComment(validated, userId)
  res.status(201).json(result)
})

export const getCommentsByContentController = asyncHandler(async (req: Request, res: Response) => {
  const contentId = String(req.params.contentId || '')
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100)
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0)

  const result = await commentsService.getCommentsByContent(contentId, limit, offset)
  res.status(200).json(result)
})

export const updateCommentController = asyncHandler(async (req: Request, res: Response) => {
  const authRequest = req as AuthenticatedRequest
  const commentId = String(req.params.commentId || '')
  const validated = commentUpdateRequestSchema.parse(req.body)
  const userId = authRequest.user.id

  const result = await commentsService.updateComment(commentId, userId, validated)
  res.status(200).json(result)
})

export const deleteCommentController = asyncHandler(async (req: Request, res: Response) => {
  const authRequest = req as AuthenticatedRequest
  const commentId = String(req.params.commentId || '')
  const userId = authRequest.user.id

  await commentsService.deleteComment(commentId, userId)
  res.status(204).send()
})

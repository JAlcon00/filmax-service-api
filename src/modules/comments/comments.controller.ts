import type { Request, Response } from 'express'
import { commentsService } from './comments.service'
import { commentCreateRequestSchema, commentUpdateRequestSchema } from '@/contracts/api.contracts'
import { asyncHandler } from '@/utils/async-handler'

export const createCommentController = asyncHandler(async (req: Request, res: Response) => {
  const validated = commentCreateRequestSchema.parse(req.body)
  const userId = req.user?.id || 'anonymous'

  const result = await commentsService.createComment(validated, userId)
  res.status(201).json(result)
})

export const getCommentsByContentController = asyncHandler(async (req: Request, res: Response) => {
  const { contentId } = req.params
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100)
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0)

  const result = await commentsService.getCommentsByContent(contentId, limit, offset)
  res.status(200).json(result)
})

export const updateCommentController = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params
  const validated = commentUpdateRequestSchema.parse(req.body)
  const userId = req.user?.id || 'anonymous'

  const result = await commentsService.updateComment(commentId, userId, validated)
  res.status(200).json(result)
})

export const deleteCommentController = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params
  const userId = req.user?.id || 'anonymous'

  await commentsService.deleteComment(commentId, userId)
  res.status(204).send()
})

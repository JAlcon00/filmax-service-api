import type { Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../utils/async-handler.js'
import { prisma } from '../config/prisma.js'
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'
import { HttpError } from '../utils/errors.js'

const createRatingSchema = z.object({
  contentId: z.string().trim().min(1, 'El contentId es requerido'),
  score: z.number().int().min(1, 'La calificación debe ser un número entero entre 1 y 10').max(10, 'La calificación debe ser un número entero entre 1 y 10'),
  comment: z.string().trim().optional()
})

export const ratingsRouter = Router()

ratingsRouter.post(
  '/',
  authMiddleware,
  asyncHandler(async (request: Request, response: Response) => {
    const authRequest = request as AuthenticatedRequest
    const { contentId, score, comment } = createRatingSchema.parse(request.body)

    const content = await prisma.content.findUnique({
      where: { id: contentId }
    })

    if (!content) {
      throw new HttpError(404, 'El contenido no existe')
    }

    const ratingKey = {
      userId: authRequest.user.id,
      contentId
    }

    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_contentId: ratingKey
      }
    })

    const rating = existingRating
      ? await prisma.rating.update({
          where: {
            userId_contentId: ratingKey
          },
          data: {
            score,
            comment
          }
        })
      : await prisma.rating.create({
          data: {
            userId: authRequest.user.id,
            contentId,
            score,
            comment
          }
        })

    response.status(existingRating ? 200 : 201).json(rating)
  })
)

ratingsRouter.get(
  '/average/:contentId',
  asyncHandler(async (request: Request, response: Response) => {
    const contentIdSchema = z.string().trim().min(1, 'El contentId es requerido')
    const contentId = contentIdSchema.parse(request.params.contentId)

    const content = await prisma.content.findUnique({
      where: { id: contentId }
    })

    if (!content) {
      throw new HttpError(404, 'El contenido no existe')
    }

    const aggregate = await prisma.rating.aggregate({
      _avg: {
        score: true
      },
      _count: {
        score: true
      },
      where: {
        contentId
      }
    })

    response.json({
      contentId,
      averageScore: aggregate._avg.score ?? 0,
      totalRatings: aggregate._count.score
    })
  })
)

ratingsRouter.get('/status', (_request, response) => {
  response.json({ module: 'ratings', status: 'scaffold-ready' })
})
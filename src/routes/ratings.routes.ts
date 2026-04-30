import type { Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../utils/async-handler.js'
import { prisma } from '../config/prisma.js'
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'
import { HttpError } from '../utils/errors.js'

const createRatingSchema = z
  .object({
    contentId: z.string().trim().min(1).optional(),
    externalId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    type: z.enum(['movie', 'series']).optional(),
    posterUrl: z.string().trim().url().nullable().optional(),
    score: z
      .number()
      .int()
      .min(1, 'La calificación debe ser un número entero entre 1 y 5')
      .max(5, 'La calificación debe ser un número entero entre 1 y 5'),
    comment: z.string().trim().optional()
  })
  .superRefine((value, context) => {
    if (!value.contentId && !value.externalId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes enviar contentId o externalId'
      })
    }

    if (value.externalId && (!value.title || !value.type)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para externalId debes enviar title y type'
      })
    }
  })

export const ratingsRouter = Router()

ratingsRouter.post(
  '/',
  authMiddleware,
  asyncHandler(async (request: Request, response: Response) => {
    const authRequest = request as AuthenticatedRequest
    const { contentId, externalId, title, type, posterUrl, score, comment } =
      createRatingSchema.parse(request.body)

    const content = contentId
      ? await prisma.content.findUnique({ where: { id: contentId } })
      : await prisma.content.upsert({
          where: { externalId: externalId as string },
          create: {
            externalId: externalId as string,
            title: title as string,
            type: type as string,
            posterUrl: posterUrl ?? null
          },
          update: {
            title: title as string,
            type: type as string,
            posterUrl: posterUrl ?? null
          }
        })

    if (!content) {
      throw new HttpError(404, 'El contenido no existe')
    }

    const ratingKey = {
      userId: authRequest.user.id,
      contentId: content.id
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
            contentId: content.id,
            score,
            comment
          }
        })

    response.status(existingRating ? 200 : 201).json({
      ...rating,
      content: {
        id: content.id,
        externalId: content.externalId,
        title: content.title,
        type: content.type,
        posterUrl: content.posterUrl
      }
    })
  })
)

ratingsRouter.get(
  '/my',
  authMiddleware,
  asyncHandler(async (request: Request, response: Response) => {
    const authRequest = request as AuthenticatedRequest

    const ratings = (await prisma.rating.findMany({
      where: {
        userId: authRequest.user.id
      },
      include: {
        content: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })) as Array<{
      id: string
      score: number
      comment: string | null
      userId: string
      contentId: string
      createdAt: Date
      updatedAt: Date
      content: {
        id: string
        externalId: string
        title: string
        type: string
        posterUrl: string | null
      }
    }>

    response.json(
      ratings.map((rating) => ({
        ...rating,
        content: {
          id: rating.content.id,
          externalId: rating.content.externalId,
          title: rating.content.title,
          type: rating.content.type,
          posterUrl: rating.content.posterUrl
        }
      }))
    )
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
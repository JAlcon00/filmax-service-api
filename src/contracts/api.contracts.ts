import { z } from 'zod'

export const errorResponseSchema = z.object({
  message: z.string()
})

export const healthResponseSchema = z.object({
  status: z.literal('ok')
})

export const moduleStatusResponseSchema = z.object({
  module: z.enum(['auth', 'movies', 'ratings', 'lists', 'users']),
  status: z.literal('scaffold-ready')
})

export const authRegisterRequestSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8)
})

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const authRegisterResponseSchema = authUserSchema

export const authLoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
})

export const authLoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('bearer'),
  expiresIn: z.string(),
  user: authUserSchema
})

export const usersMeResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional()
  })
})

export const moviesSearchQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
})

export const catalogContentItemSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['movie', 'series']),
  posterUrl: z.string().url().nullable()
})

export const moviesSearchResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  items: z.array(catalogContentItemSchema)
})

export const ratingsCreateRequestSchema = z
  .object({
    contentId: z.string().trim().min(1).optional(),
    externalId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    type: z.enum(['movie', 'series']).optional(),
    posterUrl: z.string().url().nullable().optional(),
    score: z.number().int().min(1).max(5),
    comment: z.string().trim().optional()
  })
  .refine((payload) => Boolean(payload.contentId || payload.externalId), {
    message: 'Debes enviar contentId o externalId'
  })
  .refine(
    (payload) => {
      if (!payload.externalId) {
        return true
      }

      return Boolean(payload.title && payload.type)
    },
    {
      message: 'Para externalId debes enviar title y type'
    }
  )

export const ratingSchema = z.object({
  id: z.string(),
  score: z.number().int(),
  comment: z.string().nullable(),
  userId: z.string(),
  contentId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const ratingsCreateResponseSchema = ratingSchema.extend({
  content: z.object({
    id: z.string(),
    externalId: z.string(),
    title: z.string(),
    type: z.string(),
    posterUrl: z.string().url().nullable()
  })
})

export const ratingsMyResponseSchema = z.array(
  ratingSchema.extend({
    content: catalogContentItemSchema.extend({
      id: z.string()
    })
  })
)

export const ratingsDeleteResponseSchema = z.object({
  message: z.string()
})

export const ratingsAverageResponseSchema = z.object({
  contentId: z.string(),
  averageScore: z.number(),
  totalRatings: z.number().int().nonnegative()
})

export const listsCreateRequestSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(['favorites', 'watchlist'])
})

export const listsCreateResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['favorites', 'watchlist']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const listItemCreateRequestSchema = z
  .object({
    contentId: z.string().trim().min(1).optional(),
    externalId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    type: z.enum(['movie', 'series']).optional(),
    posterUrl: z.string().url().nullable().optional()
  })
  .refine((payload) => Boolean(payload.contentId || payload.externalId), {
    message: 'Debes enviar contentId o externalId'
  })
  .refine(
    (payload) => {
      if (!payload.externalId) {
        return true
      }

      return Boolean(payload.title && payload.type)
    },
    {
      message: 'Para externalId debes enviar title y type'
    }
  )

export const listsByTypeParamsSchema = z.object({
  type: z.enum(['favorites', 'watchlist'])
})

export const listItemSchema = z.object({
  contentId: z.string(),
  externalId: z.string(),
  title: z.string(),
  type: z.enum(['movie', 'series']),
  posterUrl: z.string().url().nullable(),
  addedAt: z.coerce.date()
})

export const listsAddItemResponseSchema = listItemSchema

export const listsByTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['favorites', 'watchlist']),
  items: z.array(listItemSchema)
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type ModuleStatusResponse = z.infer<typeof moduleStatusResponseSchema>
export type AuthRegisterRequest = z.infer<typeof authRegisterRequestSchema>
export type AuthRegisterResponse = z.infer<typeof authRegisterResponseSchema>
export type AuthLoginRequest = z.infer<typeof authLoginRequestSchema>
export type AuthLoginResponse = z.infer<typeof authLoginResponseSchema>
export type UsersMeResponse = z.infer<typeof usersMeResponseSchema>
export type MoviesSearchQuery = z.infer<typeof moviesSearchQuerySchema>
export type MoviesSearchResponse = z.infer<typeof moviesSearchResponseSchema>
export type RatingsCreateRequest = z.infer<typeof ratingsCreateRequestSchema>
export type RatingsCreateResponse = z.infer<typeof ratingsCreateResponseSchema>
export type RatingsMyResponse = z.infer<typeof ratingsMyResponseSchema>
export type RatingsDeleteResponse = z.infer<typeof ratingsDeleteResponseSchema>
export type RatingsAverageResponse = z.infer<typeof ratingsAverageResponseSchema>
export type ListsCreateRequest = z.infer<typeof listsCreateRequestSchema>
export type ListsCreateResponse = z.infer<typeof listsCreateResponseSchema>
export type ListItemCreateRequest = z.infer<typeof listItemCreateRequestSchema>
export type ListsAddItemResponse = z.infer<typeof listsAddItemResponseSchema>
export type ListsByTypeParams = z.infer<typeof listsByTypeParamsSchema>
export type ListsByTypeResponse = z.infer<typeof listsByTypeResponseSchema>

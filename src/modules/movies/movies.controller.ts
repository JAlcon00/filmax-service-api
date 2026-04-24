import type { Request, Response } from 'express'
import { z } from 'zod'

import { HttpError } from '../../utils/errors.js'
import { getCatalog } from './movies.service.js'

const catalogQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export const getCatalogController = async (request: Request, response: Response) => {
  const parsedQuery = catalogQuerySchema.safeParse(request.query)

  if (!parsedQuery.success) {
    throw new HttpError(400, 'Invalid query params: q (optional string), limit (1-100)')
  }

  const items = await getCatalog({
    query: parsedQuery.data.q,
    limit: parsedQuery.data.limit
  })

  response.status(200).json({
    count: items.length,
    items
  })
}

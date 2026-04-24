import 'dotenv/config'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const REQUEST_TIMEOUT_MS = 10000
const DEFAULT_IMDB_BASE_URL = 'https://imdb-api.com'
const DEFAULT_SEED_LIMIT = 50

type ImdbTopResponse = {
  items?: Array<{
    id?: string
    title?: string
    image?: string
  }>
  errorMessage?: string
}

type SeedContentItem = {
  externalId: string
  title: string
  posterUrl: string | null
  type: 'movie' | 'series'
}

const getEnv = () => {
  const imdbApiKey = process.env.IMDB_API_KEY
  const imdbBaseUrl = process.env.IMDB_BASE_URL ?? DEFAULT_IMDB_BASE_URL
  const parsedLimit = Number(process.env.IMDB_SEED_LIMIT ?? DEFAULT_SEED_LIMIT)

  if (!imdbApiKey || imdbApiKey.trim().length === 0 || imdbApiKey === 'change-this-key') {
    throw new Error('IMDB_API_KEY is required to run the seed with IMDb data')
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 250) {
    throw new Error('IMDB_SEED_LIMIT must be an integer between 1 and 250')
  }

  return {
    imdbApiKey,
    imdbBaseUrl,
    seedLimit: parsedLimit
  }
}

const fetchImdbTop = async (
  imdbBaseUrl: string,
  imdbApiKey: string,
  resource: 'Top250Movies' | 'Top250TVs'
): Promise<ImdbTopResponse> => {
  const endpoint = `${imdbBaseUrl}/API/${resource}/${imdbApiKey}`

  const response = await globalThis.fetch(endpoint, {
    signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new Error(`IMDb request failed for ${resource} with status ${response.status}`)
  }

  const json = (await response.json()) as ImdbTopResponse

  if (typeof json.errorMessage === 'string' && json.errorMessage.trim().length > 0) {
    throw new Error(`IMDb returned an error for ${resource}: ${json.errorMessage}`)
  }

  return json
}

const normalizeItems = (
  items: ImdbTopResponse['items'],
  type: SeedContentItem['type']
): SeedContentItem[] => {
  if (!items) {
    return []
  }

  return items
    .filter((item) => Boolean(item.id && item.title))
    .map((item) => ({
      externalId: item.id as string,
      title: item.title as string,
      posterUrl: item.image ?? null,
      type
    }))
}

const upsertCatalogItems = async (items: SeedContentItem[]) => {
  let processed = 0

  for (const item of items) {
    await prisma.content.upsert({
      where: {
        externalId: item.externalId
      },
      update: {
        title: item.title,
        type: item.type,
        posterUrl: item.posterUrl
      },
      create: {
        externalId: item.externalId,
        title: item.title,
        type: item.type,
        posterUrl: item.posterUrl
      }
    })

    processed += 1
  }

  return processed
}

const main = async () => {
  const { imdbApiKey, imdbBaseUrl, seedLimit } = getEnv()

  const [moviesResponse, seriesResponse] = await Promise.all([
    fetchImdbTop(imdbBaseUrl, imdbApiKey, 'Top250Movies'),
    fetchImdbTop(imdbBaseUrl, imdbApiKey, 'Top250TVs')
  ])

  const movies = normalizeItems(moviesResponse.items, 'movie').slice(0, seedLimit)
  const series = normalizeItems(seriesResponse.items, 'series').slice(0, seedLimit)
  const deduplicatedItems = Array.from(
    new Map([...movies, ...series].map((item) => [item.externalId, item])).values()
  )

  const processed = await upsertCatalogItems(deduplicatedItems)

  console.log(
    `[seed-imdb] Processed ${processed} content items (${movies.length} movies + ${series.length} series)`
  )
}

void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unexpected seed error'

    console.error(`[seed-imdb] ${message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

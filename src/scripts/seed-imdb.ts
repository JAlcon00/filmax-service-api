import 'dotenv/config'

import { PrismaClient } from '@prisma/client'

import { browseOmdbCatalog } from '../modules/movies/omdb.client.js'

const prisma = new PrismaClient()
const DEFAULT_SEED_LIMIT = 50

type SeedContentItem = {
  externalId: string
  title: string
  posterUrl: string | null
  type: 'movie' | 'series'
}

const getEnv = () => {
  const imdbApiKey = process.env.IMDB_API_KEY
  const parsedLimit = Number(process.env.IMDB_SEED_LIMIT ?? DEFAULT_SEED_LIMIT)

  if (!imdbApiKey || imdbApiKey.trim().length === 0 || imdbApiKey === 'change-this-key') {
    throw new Error('IMDB_API_KEY is required to run the seed with OMDb data')
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 250) {
    throw new Error('IMDB_SEED_LIMIT must be an integer between 1 and 250')
  }

  return {
    seedLimit: parsedLimit
  }
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
  const { seedLimit } = getEnv()
  const catalogItems = (await browseOmdbCatalog()).slice(0, seedLimit)
  const deduplicatedItems = Array.from(
    new Map(catalogItems.map((item) => [item.externalId, item])).values()
  )

  const processed = await upsertCatalogItems(deduplicatedItems)

  console.log(`[seed-imdb] Processed ${processed} content items from OMDb`)
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

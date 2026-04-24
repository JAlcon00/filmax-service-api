import { env } from '../../config/env.js'
import { HttpError } from '../../utils/errors.js'
import type { CatalogContentItem, ContentType } from './models/index.js'

interface GetCatalogOptions {
  query?: string
  limit: number
}

type ImdbSearchResponse = {
  results?: Array<{
    id?: string
    title?: string
    image?: string
  }>
  errorMessage?: string
}

type ImdbTopResponse = {
  items?: Array<{
    id?: string
    title?: string
    image?: string
  }>
  errorMessage?: string
}

const REQUEST_TIMEOUT_MS = 8000

const buildImdbUrl = (path: string) => {
  return `${env.IMDB_BASE_URL}${path}`
}

const fetchImdbJson = async <T>(path: string): Promise<T> => {
  const response = await globalThis.fetch(buildImdbUrl(path), {
    signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new HttpError(502, 'Catalog provider is unavailable')
  }

  const data = (await response.json()) as T & { errorMessage?: string }

  if (typeof data.errorMessage === 'string' && data.errorMessage.trim().length > 0) {
    throw new HttpError(502, `Catalog provider error: ${data.errorMessage}`)
  }

  return data
}

const toCatalogItem = (
  item: { id?: string; title?: string; image?: string },
  type: ContentType
): CatalogContentItem | null => {
  if (!item.id || !item.title) {
    return null
  }

  return {
    externalId: item.id,
    title: item.title,
    type,
    posterUrl: item.image ?? null
  }
}

const uniqByExternalId = (items: CatalogContentItem[]) => {
  const map = new Map<string, CatalogContentItem>()

  for (const item of items) {
    map.set(item.externalId, item)
  }

  return Array.from(map.values())
}

const fetchSearchCatalog = async (query: string): Promise<CatalogContentItem[]> => {
  const [moviesData, seriesData] = await Promise.all([
    fetchImdbJson<ImdbSearchResponse>(`/API/SearchMovie/${env.IMDB_API_KEY}/${encodeURIComponent(query)}`),
    fetchImdbJson<ImdbSearchResponse>(`/API/SearchSeries/${env.IMDB_API_KEY}/${encodeURIComponent(query)}`)
  ])

  const movieItems = (moviesData.results ?? [])
    .map((item) => toCatalogItem(item, 'movie'))
    .filter((item): item is CatalogContentItem => item !== null)

  const seriesItems = (seriesData.results ?? [])
    .map((item) => toCatalogItem(item, 'series'))
    .filter((item): item is CatalogContentItem => item !== null)

  return uniqByExternalId([...movieItems, ...seriesItems])
}

const fetchTopCatalog = async (): Promise<CatalogContentItem[]> => {
  const [moviesData, seriesData] = await Promise.all([
    fetchImdbJson<ImdbTopResponse>(`/API/Top250Movies/${env.IMDB_API_KEY}`),
    fetchImdbJson<ImdbTopResponse>(`/API/Top250TVs/${env.IMDB_API_KEY}`)
  ])

  const movieItems = (moviesData.items ?? [])
    .map((item) => toCatalogItem(item, 'movie'))
    .filter((item): item is CatalogContentItem => item !== null)

  const seriesItems = (seriesData.items ?? [])
    .map((item) => toCatalogItem(item, 'series'))
    .filter((item): item is CatalogContentItem => item !== null)

  return uniqByExternalId([...movieItems, ...seriesItems])
}

export const getCatalog = async ({ query, limit }: GetCatalogOptions): Promise<CatalogContentItem[]> => {
  const normalizedQuery = query?.trim()
  const items = normalizedQuery ? await fetchSearchCatalog(normalizedQuery) : await fetchTopCatalog()

  return items.slice(0, limit)
}

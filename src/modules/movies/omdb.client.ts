import { env } from '../../config/env.js'
import { HttpError } from '../../utils/errors.js'
import type { CatalogContentItem, ContentType } from './models/index.js'

const REQUEST_TIMEOUT_MS = 8000
const DEFAULT_BROWSE_QUERIES = ['avengers', 'batman', 'star wars', 'matrix', 'harry potter', 'lord of the rings']

type OmdbSearchItem = {
  imdbID?: string
  Title?: string
  Poster?: string
  Type?: string
}

type OmdbSearchResponse = {
  Search?: OmdbSearchItem[]
  Response?: 'True' | 'False'
  Error?: string
}

const buildOmdbUrl = (params: Record<string, string>) => {
  const url = new URL(env.IMDB_BASE_URL)
  url.searchParams.set('apikey', env.IMDB_API_KEY)

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  return url.toString()
}

const fetchOmdbJson = async <T>(params: Record<string, string>): Promise<T> => {
  const response = await globalThis.fetch(buildOmdbUrl(params), {
    signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new HttpError(502, 'Catalog provider is unavailable')
  }

  const data = (await response.json()) as T & { Response?: string; Error?: string }

  if (data.Response === 'False' && typeof data.Error === 'string' && data.Error.trim().length > 0) {
    if (!/not found/i.test(data.Error)) {
      throw new HttpError(502, `Catalog provider error: ${data.Error}`)
    }
  }

  return data
}

const toCatalogItem = (
  item: OmdbSearchItem,
  fallbackType: ContentType
): CatalogContentItem | null => {
  if (!item.imdbID || !item.Title) {
    return null
  }

  const resolvedType = item.Type === 'series' ? 'series' : item.Type === 'movie' ? 'movie' : fallbackType

  return {
    externalId: item.imdbID,
    title: item.Title,
    type: resolvedType,
    posterUrl: item.Poster && item.Poster !== 'N/A' ? item.Poster : null
  }
}

const uniqByExternalId = (items: CatalogContentItem[]) => {
  const map = new Map<string, CatalogContentItem>()

  for (const item of items) {
    map.set(item.externalId, item)
  }

  return Array.from(map.values())
}

const searchCatalogByType = async (query: string, type: ContentType): Promise<CatalogContentItem[]> => {
  const data = await fetchOmdbJson<OmdbSearchResponse>({ s: query, type, page: '1' })

  return (data.Search ?? [])
    .map((item) => toCatalogItem(item, type))
    .filter((item): item is CatalogContentItem => item !== null)
}

export const searchOmdbCatalog = async (query: string): Promise<CatalogContentItem[]> => {
  const [moviesData, seriesData] = await Promise.all([
    searchCatalogByType(query, 'movie'),
    searchCatalogByType(query, 'series')
  ])

  return uniqByExternalId([...moviesData, ...seriesData])
}

export const browseOmdbCatalog = async (): Promise<CatalogContentItem[]> => {
  const searchResults = await Promise.all(
    DEFAULT_BROWSE_QUERIES.flatMap((query) => [
      searchCatalogByType(query, 'movie'),
      searchCatalogByType(query, 'series')
    ])
  )

  return uniqByExternalId(searchResults.flat())
}

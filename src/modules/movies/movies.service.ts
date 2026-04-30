import type { CatalogContentItem } from './models/index.js'
import { browseOmdbCatalog, searchOmdbCatalog } from './omdb.client.js'

interface GetCatalogOptions {
  query?: string
  limit: number
}

const fetchSearchCatalog = async (query: string): Promise<CatalogContentItem[]> => {
  return searchOmdbCatalog(query)
}

const fetchTopCatalog = async (): Promise<CatalogContentItem[]> => {
  return browseOmdbCatalog()
}

export const getCatalog = async ({ query, limit }: GetCatalogOptions): Promise<CatalogContentItem[]> => {
  const normalizedQuery = query?.trim()
  const items = normalizedQuery ? await fetchSearchCatalog(normalizedQuery) : await fetchTopCatalog()

  return items.slice(0, limit)
}

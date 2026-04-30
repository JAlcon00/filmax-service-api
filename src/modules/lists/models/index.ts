import type { ContentType } from '../../movies/models/index.js'

export type ListType = 'favorites' | 'watchlist'

export interface CreateListInput {
  name: string
  type: ListType
}

export interface CreateListItemInput {
  contentId?: string
  externalId?: string
  title?: string
  type?: ContentType
  posterUrl?: string | null
}

export interface ListItemModel {
  contentId: string
  externalId: string
  title: string
  type: ContentType
  posterUrl: string | null
  addedAt: Date
}

export interface ListModel {
  id: string
  name: string
  type: ListType
  items: ListItemModel[]
}

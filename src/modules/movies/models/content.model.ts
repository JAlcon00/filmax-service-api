export type ContentType = 'movie' | 'series'

export interface ContentModel {
  id: string
  externalId: string
  title: string
  type: ContentType
  posterUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateContentModelInput {
  externalId: string
  title: string
  type: ContentType
  posterUrl?: string | null
}

export interface UpdateContentModelInput {
  title?: string
  type?: ContentType
  posterUrl?: string | null
}

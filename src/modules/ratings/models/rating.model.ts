export interface RatingModel {
  id: string
  score: number
  comment: string | null
  userId: string
  contentId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateRatingModelInput {
  score: number
  comment?: string | null
  userId: string
  contentId: string
}

export interface UpdateRatingModelInput {
  score?: number
  comment?: string | null
}

export interface RatingOwnershipModel {
  userId: string
  contentId: string
}

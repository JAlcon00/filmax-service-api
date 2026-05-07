export interface CommentModel {
  id: string
  text: string
  rating: number | null
  userId: string
  contentId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCommentInput {
  text: string
  rating?: number
  contentId?: string
  externalId?: string
  title?: string
  type?: string
}

export interface CommentResponseWithAuthor extends CommentModel {
  author: {
    id: string
    name: string
    email: string
  }
}

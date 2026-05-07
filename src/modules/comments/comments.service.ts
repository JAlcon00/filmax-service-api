import { prisma } from '@/config/prisma'
import { HttpError } from '@/utils/errors'
import type { CommentModel, CreateCommentInput, CommentResponseWithAuthor } from './models'

export class CommentsService {
  async createComment(
    input: CreateCommentInput,
    userId: string
  ): Promise<CommentResponseWithAuthor> {
    const { text, rating, contentId, externalId, title, type } = input

    let resolvedContentId = contentId

    // Si no hay contentId, crear contenido con externalId
    if (!resolvedContentId && externalId && title && type) {
      const existingContent = await prisma.content.findFirst({
        where: { externalId }
      })

      if (existingContent) {
        resolvedContentId = existingContent.id
      } else {
        const newContent = await prisma.content.create({
          data: {
            externalId,
            title,
            type
          }
        })
        resolvedContentId = newContent.id
      }
    }

    if (!resolvedContentId) {
      throw new HttpError(400, 'Se requiere contentId o (externalId + title + type)')
    }

    // Validar que el contenido existe
    const content = await prisma.content.findUnique({
      where: { id: resolvedContentId }
    })

    if (!content) {
      throw new HttpError(404, 'Contenido no encontrado')
    }

    // Asegurar que el usuario existe
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, name: 'Unknown User', email: `user-${userId}@filmax.local` }
      })
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        rating: rating || null,
        userId,
        contentId: resolvedContentId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return {
      ...comment,
      author: comment.user
    }
  }

  async getCommentsByContent(
    contentId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ comments: CommentResponseWithAuthor[]; total: number }> {
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { contentId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.comment.count({ where: { contentId } })
    ])

    return {
      comments: comments.map((c) => ({
        ...c,
        author: c.user
      })),
      total
    }
  }

  async updateComment(commentId: string, userId: string, input: Partial<CreateCommentInput>) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      throw new HttpError(404, 'Comentario no encontrado')
    }

    if (comment.userId !== userId) {
      throw new HttpError(403, 'No autorizado para editar este comentario')
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(input.text && { text: input.text }),
        ...(input.rating !== undefined && { rating: input.rating || null })
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return {
      ...updated,
      author: updated.user
    }
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      throw new HttpError(404, 'Comentario no encontrado')
    }

    if (comment.userId !== userId) {
      throw new HttpError(403, 'No autorizado para eliminar este comentario')
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })
  }
}

export const commentsService = new CommentsService()

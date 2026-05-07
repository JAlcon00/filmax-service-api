import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '@/app'
import * as jwt from 'jsonwebtoken'
import { prisma } from '@/config/prisma'

// Mock Prisma
vi.mock('@/config/prisma', () => ({
  prisma: {
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn()
    },
    content: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn()
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

const testUserId = 'test-user-123'
const testContentId = 'test-content-123'
const testCommentId = 'test-comment-123'

const generateToken = (userId: string = testUserId) => {
  return jwt.sign({ sub: userId, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret-key-for-testing-only', { expiresIn: '1h' })
}

describe('E2E Comments API', () => {
  let mockData = {
    users: new Map(),
    contents: new Map(),
    comments: new Map()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockData = {
      users: new Map(),
      contents: new Map(),
      comments: new Map()
    }
  })

  it('expone el status del módulo de comentarios', async () => {
    const response = await request(app).get('/api/comments/status')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'Comments module is running' })
  })

  it('crea comentario con externalId (contenido nuevo)', async () => {
    const token = generateToken()
    
    const newContent = {
      id: testContentId,
      externalId: 'ext-123',
      title: 'Test Movie',
      type: 'movie'
    }
    
    const newComment = {
      id: testCommentId,
      text: 'Great movie!',
      rating: 5,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: testUserId, name: 'Test User', email: 'test@example.com' }
    }

    vi.mocked(prisma.content.findFirst).mockResolvedValueOnce(null)
    vi.mocked(prisma.content.create).mockResolvedValueOnce(newContent)
    vi.mocked(prisma.content.findUnique).mockResolvedValueOnce(newContent)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    vi.mocked(prisma.comment.create).mockResolvedValueOnce(newComment)

    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Great movie!',
        rating: 5,
        externalId: 'ext-123',
        title: 'Test Movie',
        type: 'movie'
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      text: 'Great movie!',
      rating: 5,
      userId: testUserId,
      author: { id: testUserId, name: 'Test User', email: 'test@example.com' }
    })
  })

  it('crea comentario sin rating (rating opcional)', async () => {
    const token = generateToken()
    
    const newComment = {
      id: testCommentId,
      text: 'Nice movie',
      rating: null,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: testUserId, name: 'Test User', email: 'test@example.com' }
    }

    vi.mocked(prisma.content.findUnique).mockResolvedValueOnce({
      id: testContentId,
      externalId: 'ext-123',
      title: 'Test Movie',
      type: 'movie',
      posterUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    vi.mocked(prisma.comment.create).mockResolvedValueOnce(newComment)

    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Nice movie',
        contentId: testContentId
      })

    expect(response.status).toBe(201)
    expect(response.body.rating).toBeNull()
  })

  it('rechaza comentario sin autenticación', async () => {
    const response = await request(app)
      .post('/api/comments')
      .send({
        text: 'Comment without auth',
        contentId: testContentId
      })

    expect(response.status).toBe(401)
  })

  it('valida texto mínimo (1 char)', async () => {
    const token = generateToken()
    
    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: '',
        contentId: testContentId
      })

    expect(response.status).toBe(400)
  })

  it('valida texto máximo (500 chars)', async () => {
    const token = generateToken()
    const longText = 'a'.repeat(501)
    
    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: longText,
        contentId: testContentId
      })

    expect(response.status).toBe(400)
  })

  it('valida rating válido (1-5)', async () => {
    const token = generateToken()
    
    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Comment',
        rating: 10,
        contentId: testContentId
      })

    expect(response.status).toBe(400)
  })

  it('requiere contentId o (externalId + title + type)', async () => {
    const token = generateToken()
    
    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Comment without required fields'
      })

    expect(response.status).toBe(400)
  })

  it('obtiene comentarios de un contenido', async () => {
    const comments = [
      {
        id: 'comment-1',
        text: 'First comment',
        rating: 5,
        userId: testUserId,
        contentId: testContentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: testUserId, name: 'User 1', email: 'user1@example.com' }
      }
    ]

    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce(comments)
    vi.mocked(prisma.comment.count).mockResolvedValueOnce(1)

    const response = await request(app)
      .get(`/api/comments/content/${testContentId}`)
      .query({ limit: 10, offset: 0 })

    expect(response.status).toBe(200)
    expect(response.body.comments).toHaveLength(1)
    expect(response.body.total).toBe(1)
    expect(response.body.comments[0]).toMatchObject({
      text: 'First comment',
      rating: 5
    })
  })

  it('pagina los comentarios correctamente', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.comment.count).mockResolvedValueOnce(0)

    const response = await request(app)
      .get(`/api/comments/content/${testContentId}`)
      .query({ limit: 5, offset: 10 })

    expect(response.status).toBe(200)
    expect(response.body.comments).toHaveLength(0)
    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 10
      })
    )
  })

  it('edita comentario propio', async () => {
    const token = generateToken()
    
    const updatedComment = {
      id: testCommentId,
      text: 'Updated comment',
      rating: 4,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: testUserId, name: 'Test User', email: 'test@example.com' }
    }

    vi.mocked(prisma.comment.findUnique).mockResolvedValueOnce({
      id: testCommentId,
      text: 'Original comment',
      rating: 5,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    vi.mocked(prisma.comment.update).mockResolvedValueOnce(updatedComment)

    const response = await request(app)
      .patch(`/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Updated comment',
        rating: 4
      })

    expect(response.status).toBe(200)
    expect(response.body.text).toBe('Updated comment')
    expect(response.body.rating).toBe(4)
  })

  it('rechaza edición de comentario ajeno', async () => {
    const token = generateToken('other-user-id')
    
    vi.mocked(prisma.comment.findUnique).mockResolvedValueOnce({
      id: testCommentId,
      text: 'Original comment',
      rating: 5,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const response = await request(app)
      .patch(`/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Hacked!',
        rating: 1
      })

    expect(response.status).toBe(403)
  })

  it('elimina comentario propio', async () => {
    const token = generateToken()
    
    vi.mocked(prisma.comment.findUnique).mockResolvedValueOnce({
      id: testCommentId,
      text: 'To delete',
      rating: 5,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    vi.mocked(prisma.comment.delete).mockResolvedValueOnce({
      id: testCommentId,
      text: 'To delete',
      rating: 5,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const response = await request(app)
      .delete(`/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(204)
  })

  it('rechaza eliminación de comentario ajeno', async () => {
    const token = generateToken('other-user-id')
    
    vi.mocked(prisma.comment.findUnique).mockResolvedValueOnce({
      id: testCommentId,
      text: 'To delete',
      rating: 5,
      userId: testUserId,
      contentId: testContentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const response = await request(app)
      .delete(`/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
  })

  it('retorna 404 para comentario inexistente', async () => {
    const token = generateToken()
    
    vi.mocked(prisma.comment.findUnique).mockResolvedValueOnce(null)

    const response = await request(app)
      .patch('/api/comments/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Update'
      })

    expect(response.status).toBe(404)
  })

  it('retorna 404 para contenido inexistente en POST', async () => {
    const token = generateToken()
    
    vi.mocked(prisma.content.findUnique).mockResolvedValueOnce(null)

    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Comment for non-existent content',
        contentId: 'non-existent-id'
      })

    expect(response.status).toBe(404)
  })
})

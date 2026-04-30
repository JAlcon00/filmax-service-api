import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.PORT = '3000'
  process.env.NODE_ENV = 'test'
  process.env.SERVICE_URI = 'mysql://user:password@localhost:3306/filmax'
  process.env.JWT_SECRET = 'test-secret-key-123456'
  process.env.JWT_EXPIRES_IN = '1h'
  process.env.IMDB_API_KEY = 'test-api-key'
  process.env.IMDB_BASE_URL = 'https://www.omdbapi.com'

  return {}
})

type UserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

type ContentRecord = {
  id: string
  externalId: string
  title: string
  type: 'movie' | 'series'
  posterUrl: string | null
  createdAt: Date
  updatedAt: Date
}

type RatingRecord = {
  id: string
  score: number
  comment: string | null
  userId: string
  contentId: string
  createdAt: Date
  updatedAt: Date
}

type PersonalListRecord = {
  id: string
  name: string
  type: 'favorites' | 'watchlist'
  userId: string
  createdAt: Date
  updatedAt: Date
}

type PersonalListItemRecord = {
  id: string
  personalListId: string
  contentId: string
  createdAt: Date
}

type MockState = {
  users: Map<string, UserRecord>
  contentsById: Map<string, ContentRecord>
  contentsByExternalId: Map<string, ContentRecord>
  ratings: Map<string, RatingRecord>
  personalLists: Map<string, PersonalListRecord>
  personalListItems: Map<string, PersonalListItemRecord>
  counters: {
    user: number
    content: number
    rating: number
    list: number
    item: number
  }
}

const store = vi.hoisted(() => {
  const state: MockState = {
    users: new Map(),
    contentsById: new Map(),
    contentsByExternalId: new Map(),
    ratings: new Map(),
    personalLists: new Map(),
    personalListItems: new Map(),
    counters: {
      user: 0,
      content: 0,
      rating: 0,
      list: 0,
      item: 0
    }
  }

  const now = () => new Date()

  const nextId = (prefix: string, key: keyof MockState['counters']) => {
    state.counters[key] += 1
    return `${prefix}-${state.counters[key]}`
  }

  const getContentById = (contentId: string) => {
    const content = state.contentsById.get(contentId)

    if (!content) {
      throw new Error(`Missing content: ${contentId}`)
    }

    return content
  }

  const reset = () => {
    state.users.clear()
    state.contentsById.clear()
    state.contentsByExternalId.clear()
    state.ratings.clear()
    state.personalLists.clear()
    state.personalListItems.clear()
    state.counters.user = 0
    state.counters.content = 0
    state.counters.rating = 0
    state.counters.list = 0
    state.counters.item = 0
  }

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email: string } }) => {
        return state.users.get(where.email) ?? null
      },
      create: async ({ data }: { data: { name: string; email: string; passwordHash: string } }) => {
        const user: UserRecord = {
          id: nextId('user', 'user'),
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: now(),
          updatedAt: now()
        }

        state.users.set(user.email, user)

        return user
      }
    },
    content: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return state.contentsById.get(where.id) ?? null
      },
      upsert: async ({
        where,
        create,
        update
      }: {
        where: { externalId: string }
        create: { externalId: string; title: string; type: 'movie' | 'series'; posterUrl?: string | null }
        update: { title: string; type: 'movie' | 'series'; posterUrl?: string | null }
      }) => {
        const existingContent = state.contentsByExternalId.get(where.externalId)

        if (existingContent) {
          const updatedContent: ContentRecord = {
            ...existingContent,
            title: update.title,
            type: update.type,
            posterUrl: update.posterUrl ?? null,
            updatedAt: now()
          }

          state.contentsByExternalId.set(updatedContent.externalId, updatedContent)
          state.contentsById.set(updatedContent.id, updatedContent)

          return updatedContent
        }

        const content: ContentRecord = {
          id: nextId('content', 'content'),
          externalId: create.externalId,
          title: create.title,
          type: create.type,
          posterUrl: create.posterUrl ?? null,
          createdAt: now(),
          updatedAt: now()
        }

        state.contentsByExternalId.set(content.externalId, content)
        state.contentsById.set(content.id, content)

        return content
      }
    },
    rating: {
      findUnique: async ({
        where
      }: {
        where: { userId_contentId: { userId: string; contentId: string } }
      }) => {
        return state.ratings.get(`${where.userId_contentId.userId}:${where.userId_contentId.contentId}`) ?? null
      },
      create: async ({ data }: { data: { userId: string; contentId: string; score: number; comment?: string | null } }) => {
        const rating: RatingRecord = {
          id: nextId('rating', 'rating'),
          score: data.score,
          comment: data.comment ?? null,
          userId: data.userId,
          contentId: data.contentId,
          createdAt: now(),
          updatedAt: now()
        }

        state.ratings.set(`${rating.userId}:${rating.contentId}`, rating)

        return rating
      },
      update: async ({
        where,
        data
      }: {
        where: { userId_contentId: { userId: string; contentId: string } }
        data: { score?: number; comment?: string | null }
      }) => {
        const key = `${where.userId_contentId.userId}:${where.userId_contentId.contentId}`
        const existingRating = state.ratings.get(key)

        if (!existingRating) {
          throw new Error(`Missing rating: ${key}`)
        }

        const updatedRating: RatingRecord = {
          ...existingRating,
          score: data.score ?? existingRating.score,
          comment: data.comment ?? existingRating.comment,
          updatedAt: now()
        }

        state.ratings.set(key, updatedRating)

        return updatedRating
      },
      findMany: async ({
        where,
        include,
        orderBy
      }: {
        where: { userId: string }
        include?: { content?: boolean }
        orderBy?: { createdAt?: 'asc' | 'desc' }
      }) => {
        const ratings = Array.from(state.ratings.values()).filter((rating) => rating.userId === where.userId)

        ratings.sort((left, right) => {
          if (orderBy?.createdAt === 'asc') {
            return left.createdAt.getTime() - right.createdAt.getTime()
          }

          return right.createdAt.getTime() - left.createdAt.getTime()
        })

        if (!include?.content) {
          return ratings
        }

        return ratings.map((rating) => ({
          ...rating,
          content: getContentById(rating.contentId)
        }))
      },
      aggregate: async ({
        where
      }: {
        where: { contentId: string }
      }) => {
        const ratings = Array.from(state.ratings.values()).filter((rating) => rating.contentId === where.contentId)

        if (ratings.length === 0) {
          return {
            _avg: { score: null },
            _count: { score: 0 }
          }
        }

        const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0)

        return {
          _avg: { score: totalScore / ratings.length },
          _count: { score: ratings.length }
        }
      }
    },
    personalList: {
      findUnique: async ({
        where,
        include
      }: {
        where: { userId_type: { userId: string; type: 'favorites' | 'watchlist' } }
        include?: { listItems?: { include?: { content?: boolean } } }
      }) => {
        const list = state.personalLists.get(`${where.userId_type.userId}:${where.userId_type.type}`) ?? null

        if (!list) {
          return null
        }

        if (!include?.listItems) {
          return list
        }

        const listItems = Array.from(state.personalListItems.values())
          .filter((item) => item.personalListId === list.id)
          .map((item) => ({
            ...item,
            content: include.listItems?.include?.content ? getContentById(item.contentId) : undefined
          }))

        return {
          ...list,
          listItems
        }
      },
      create: async ({
        data
      }: {
        data: { name: string; type: 'favorites' | 'watchlist'; userId: string }
      }) => {
        const list: PersonalListRecord = {
          id: nextId('list', 'list'),
          name: data.name,
          type: data.type,
          userId: data.userId,
          createdAt: now(),
          updatedAt: now()
        }

        state.personalLists.set(`${data.userId}:${data.type}`, list)

        return list
      }
    },
    personalListItem: {
      findUnique: async ({
        where
      }: {
        where: { personalListId_contentId: { personalListId: string; contentId: string } }
      }) => {
        return state.personalListItems.get(
          `${where.personalListId_contentId.personalListId}:${where.personalListId_contentId.contentId}`
        ) ?? null
      },
      create: async ({
        data,
        include
      }: {
        data: { personalListId: string; contentId: string }
        include?: { content?: boolean }
      }) => {
        const item: PersonalListItemRecord = {
          id: nextId('item', 'item'),
          personalListId: data.personalListId,
          contentId: data.contentId,
          createdAt: now()
        }

        state.personalListItems.set(`${item.personalListId}:${item.contentId}`, item)

        if (!include?.content) {
          return item
        }

        return {
          ...item,
          content: getContentById(item.contentId)
        }
      },
      delete: async ({
        where
      }: {
        where: { personalListId_contentId: { personalListId: string; contentId: string } }
      }) => {
        const key = `${where.personalListId_contentId.personalListId}:${where.personalListId_contentId.contentId}`
        const existingItem = state.personalListItems.get(key)

        if (!existingItem) {
          throw new Error(`Missing list item: ${key}`)
        }

        state.personalListItems.delete(key)

        return existingItem
      }
    }
  }

  const omdb = {
    searchOmdbCatalog: vi.fn(async (query: string) => {
      return [
        {
          externalId: `tt-search-${query}-1`,
          title: `${query} One`,
          type: 'movie' as const,
          posterUrl: 'https://example.com/search-1.jpg'
        },
        {
          externalId: `tt-search-${query}-2`,
          title: `${query} Two`,
          type: 'series' as const,
          posterUrl: null
        }
      ]
    }),
    browseOmdbCatalog: vi.fn(async () => {
      return [
        {
          externalId: 'tt-browse-1',
          title: 'Browse One',
          type: 'movie' as const,
          posterUrl: 'https://example.com/browse-1.jpg'
        },
        {
          externalId: 'tt-browse-2',
          title: 'Browse Two',
          type: 'series' as const,
          posterUrl: null
        }
      ]
    })
  }

  return {
    prisma,
    omdb,
    reset
  }
})

vi.mock('../src/config/prisma.js', () => ({
  prisma: store.prisma
}))

vi.mock('../src/modules/movies/omdb.client.js', () => store.omdb)

const { createServer } = await import('../src/app.js')

const app = createServer()
const api = request(app)

const registerAndLogin = async () => {
  await api.post('/api/auth/register').send({
    name: 'Usuario Test',
    email: 'test@example.com',
    password: 'password123'
  })

  const loginResponse = await api.post('/api/auth/login').send({
    email: 'test@example.com',
    password: 'password123'
  })

  return {
    token: loginResponse.body.accessToken as string,
    user: loginResponse.body.user as { id: string; email: string; name: string }
  }
}

beforeEach(() => {
  store.reset()
  store.omdb.searchOmdbCatalog.mockClear()
  store.omdb.browseOmdbCatalog.mockClear()
})

describe('E2E HTTP de la API FILMAX', () => {
  it('expone los endpoints de health y status', async () => {
    const healthResponse = await api.get('/health')
    expect(healthResponse.status).toBe(200)
    expect(healthResponse.body).toEqual({ status: 'ok' })

    const authStatus = await api.get('/api/auth/status')
    const moviesStatus = await api.get('/api/movies/status')
    const ratingsStatus = await api.get('/api/ratings/status')
    const listsStatus = await api.get('/api/lists/status')
    const usersStatus = await api.get('/api/users/status')

    expect(authStatus.body).toEqual({ module: 'auth', status: 'scaffold-ready' })
    expect(moviesStatus.body).toEqual({ module: 'movies', status: 'scaffold-ready' })
    expect(ratingsStatus.body).toEqual({ module: 'ratings', status: 'scaffold-ready' })
    expect(listsStatus.body).toEqual({ module: 'lists', status: 'scaffold-ready' })
    expect(usersStatus.body).toEqual({ module: 'users', status: 'scaffold-ready' })
  })

  it('registra, autentica y protege /api/users/me', async () => {
    const registerResponse = await api.post('/api/auth/register').send({
      name: 'Usuario Test',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body).toMatchObject({
      id: expect.any(String),
      name: 'Usuario Test',
      email: 'test@example.com',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    const duplicateRegisterResponse = await api.post('/api/auth/register').send({
      name: 'Usuario Test',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(duplicateRegisterResponse.status).toBe(409)
    expect(duplicateRegisterResponse.body).toEqual({ message: 'El correo ya está registrado' })

    const loginResponse = await api.post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body).toMatchObject({
      accessToken: expect.any(String),
      tokenType: 'bearer',
      expiresIn: '1h',
      user: {
        id: expect.any(String),
        name: 'Usuario Test',
        email: 'test@example.com'
      }
    })
    expect(() => jwt.verify(loginResponse.body.accessToken as string, process.env.JWT_SECRET as string)).not.toThrow()

    const invalidLoginResponse = await api.post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrong-password'
    })

    expect(invalidLoginResponse.status).toBe(401)
    expect(invalidLoginResponse.body).toEqual({ message: 'Credenciales inválidas' })

    const unauthorizedMeResponse = await api.get('/api/users/me')
    expect(unauthorizedMeResponse.status).toBe(401)
    expect(unauthorizedMeResponse.body).toEqual({ message: 'Se requiere token de autorización' })

    const authorizedMeResponse = await api
      .get('/api/users/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`)

    expect(authorizedMeResponse.status).toBe(200)
    expect(authorizedMeResponse.body).toEqual({
      user: {
        id: expect.any(String),
        email: 'test@example.com',
        name: 'Usuario Test'
      }
    })
  })

  it('consulta catálogo de películas sin autenticación y respeta limit', async () => {
    const searchResponse = await api.get('/api/movies/search').query({ q: 'Matrix', limit: 1 })

    expect(searchResponse.status).toBe(200)
    expect(searchResponse.body).toEqual({
      count: 1,
      items: [
        {
          externalId: 'tt-search-Matrix-1',
          title: 'Matrix One',
          type: 'movie',
          posterUrl: 'https://example.com/search-1.jpg'
        }
      ]
    })
  })

  it('crea, consulta, actualiza y borra listas personales', async () => {
    const { token } = await registerAndLogin()

    const createListResponse = await api
      .post('/api/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Mis favoritas',
        type: 'watchlist'
      })

    expect(createListResponse.status).toBe(201)
    expect(createListResponse.body).toMatchObject({
      id: expect.any(String),
      name: 'Mis favoritas',
      type: 'watchlist',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    const duplicateListResponse = await api
      .post('/api/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Otra lista',
        type: 'watchlist'
      })

    expect(duplicateListResponse.status).toBe(409)
    expect(duplicateListResponse.body).toEqual({
      message: 'Ya existe una lista de este tipo para el usuario'
    })

    const getEmptyListResponse = await api.get('/api/lists/watchlist').set('Authorization', `Bearer ${token}`)

    expect(getEmptyListResponse.status).toBe(200)
    expect(getEmptyListResponse.body).toMatchObject({
      id: expect.any(String),
      name: 'Mis favoritas',
      type: 'watchlist',
      items: []
    })

    const addItemResponse = await api
      .post('/api/lists/watchlist/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        externalId: 'tt0133093',
        title: 'The Matrix',
        type: 'movie',
        posterUrl: 'https://example.com/matrix.jpg'
      })

    expect(addItemResponse.status).toBe(201)
    expect(addItemResponse.body).toMatchObject({
      contentId: expect.any(String),
      externalId: 'tt0133093',
      title: 'The Matrix',
      type: 'movie',
      posterUrl: 'https://example.com/matrix.jpg',
      addedAt: expect.any(String)
    })

    const duplicateItemResponse = await api
      .post('/api/lists/watchlist/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        externalId: 'tt0133093',
        title: 'The Matrix',
        type: 'movie',
        posterUrl: 'https://example.com/matrix.jpg'
      })

    expect(duplicateItemResponse.status).toBe(409)
    expect(duplicateItemResponse.body).toEqual({
      message: 'El contenido ya está en la lista'
    })

    const getListWithItemResponse = await api.get('/api/lists/watchlist').set('Authorization', `Bearer ${token}`)

    expect(getListWithItemResponse.status).toBe(200)
    expect(getListWithItemResponse.body.items).toHaveLength(1)
    expect(getListWithItemResponse.body.items[0]).toMatchObject({
      contentId: addItemResponse.body.contentId,
      externalId: 'tt0133093',
      title: 'The Matrix',
      type: 'movie',
      posterUrl: 'https://example.com/matrix.jpg'
    })

    const removeItemResponse = await api
      .delete(`/api/lists/watchlist/items/${addItemResponse.body.contentId as string}`)
      .set('Authorization', `Bearer ${token}`)

    expect(removeItemResponse.status).toBe(204)

    const getEmptyAfterDeleteResponse = await api
      .get('/api/lists/watchlist')
      .set('Authorization', `Bearer ${token}`)

    expect(getEmptyAfterDeleteResponse.status).toBe(200)
    expect(getEmptyAfterDeleteResponse.body.items).toHaveLength(0)
  })

  it('crea, actualiza y consulta ratings', async () => {
    const { token } = await registerAndLogin()

    const createRatingResponse = await api
      .post('/api/ratings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        externalId: 'tt0133093',
        title: 'The Matrix',
        type: 'movie',
        posterUrl: 'https://example.com/matrix.jpg',
        score: 5,
        comment: 'Excelente película'
      })

    expect(createRatingResponse.status).toBe(201)
    expect(createRatingResponse.body).toMatchObject({
      id: expect.any(String),
      score: 5,
      comment: 'Excelente película',
      userId: expect.any(String),
      contentId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      content: {
        id: expect.any(String),
        externalId: 'tt0133093',
        title: 'The Matrix',
        type: 'movie',
        posterUrl: 'https://example.com/matrix.jpg'
      }
    })

    const updateRatingResponse = await api
      .post('/api/ratings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        externalId: 'tt0133093',
        title: 'The Matrix',
        type: 'movie',
        posterUrl: 'https://example.com/matrix.jpg',
        score: 4,
        comment: 'Sigue siendo muy buena'
      })

    expect(updateRatingResponse.status).toBe(200)
    expect(updateRatingResponse.body).toMatchObject({
      score: 4,
      comment: 'Sigue siendo muy buena'
    })

    const myRatingsResponse = await api.get('/api/ratings/my').set('Authorization', `Bearer ${token}`)

    expect(myRatingsResponse.status).toBe(200)
    expect(myRatingsResponse.body).toHaveLength(1)
    expect(myRatingsResponse.body[0]).toMatchObject({
      score: 4,
      comment: 'Sigue siendo muy buena',
      content: {
        externalId: 'tt0133093',
        title: 'The Matrix',
        type: 'movie',
        posterUrl: 'https://example.com/matrix.jpg'
      }
    })

    const averageResponse = await api.get(`/api/ratings/average/${updateRatingResponse.body.contentId as string}`)

    expect(averageResponse.status).toBe(200)
    expect(averageResponse.body).toEqual({
      contentId: updateRatingResponse.body.contentId,
      averageScore: 4,
      totalRatings: 1
    })

    const unauthorizedRatingResponse = await api.post('/api/ratings').send({
      externalId: 'tt9999999',
      title: 'No Auth',
      type: 'movie',
      score: 5
    })

    expect(unauthorizedRatingResponse.status).toBe(401)
    expect(unauthorizedRatingResponse.body).toEqual({ message: 'Se requiere token de autorización' })
  })

  it('rechaza payloads inválidos y recursos inexistentes', async () => {
    const { token } = await registerAndLogin()

    const invalidRegisterResponse = await api.post('/api/auth/register').send({
      name: '',
      email: 'no-es-email',
      password: '123'
    })

    expect(invalidRegisterResponse.status).toBe(400)
    expect(invalidRegisterResponse.body).toMatchObject({
      message: 'Datos de entrada inválidos',
      issues: expect.arrayContaining([
        expect.objectContaining({ path: 'name' }),
        expect.objectContaining({ path: 'email' }),
        expect.objectContaining({ path: 'password' })
      ])
    })

    const invalidMoviesQueryResponse = await api.get('/api/movies/search').query({ q: 'Matrix', limit: 0 })

    expect(invalidMoviesQueryResponse.status).toBe(400)
    expect(invalidMoviesQueryResponse.body).toEqual({
      message: 'Invalid query params: q (optional string), limit (1-100)'
    })

    const invalidRatingResponse = await api
      .post('/api/ratings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        externalId: 'tt0133093',
        title: 'The Matrix',
        type: 'movie',
        score: 6
      })

    expect(invalidRatingResponse.status).toBe(400)
    expect(invalidRatingResponse.body).toMatchObject({
      message: 'Datos de entrada inválidos',
      issues: expect.arrayContaining([
        expect.objectContaining({ path: 'score' })
      ])
    })

    const missingListResponse = await api.get('/api/lists/favorites').set('Authorization', `Bearer ${token}`)

    expect(missingListResponse.status).toBe(404)
    expect(missingListResponse.body).toEqual({ message: 'Lista no encontrada' })

    const invalidListTypeResponse = await api.get('/api/lists/invalid-type').set('Authorization', `Bearer ${token}`)

    expect(invalidListTypeResponse.status).toBe(400)
    expect(invalidListTypeResponse.body).toMatchObject({
      message: 'Datos de entrada inválidos',
      issues: expect.arrayContaining([
        expect.objectContaining({ path: 'type' })
      ])
    })

    const missingAverageResponse = await api.get('/api/ratings/average/non-existent-content')

    expect(missingAverageResponse.status).toBe(404)
    expect(missingAverageResponse.body).toEqual({ message: 'El contenido no existe' })
  })
})
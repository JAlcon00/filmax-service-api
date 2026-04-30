import { describe, it, expect, beforeEach } from 'vitest'
import { authRegisterRequestSchema, authLoginRequestSchema } from '../src/contracts/api.contracts'
import { sign, verify } from 'jsonwebtoken'
import { mapPrismaErrorToHttp } from '../src/utils/prisma-errors'
import { HttpError } from '../src/utils/errors'

describe('Auth validation and token', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-123456'
    process.env.JWT_EXPIRES_IN = '1h'
  })

  it('register: válido', () => {
    expect(() =>
      authRegisterRequestSchema.parse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'strongpass'
      })
    ).not.toThrow()
  })

  it('register: password débil falla', () => {
    expect(() =>
      authRegisterRequestSchema.parse({
        name: 'Test User',
        email: 'test@example.com',
        password: '123'
      })
    ).toThrow()
  })

  it('mapPrismaErrorToHttp convierte P2002 en HttpError 409', () => {
    const prismaErr = { code: 'P2002' }
    expect(() => mapPrismaErrorToHttp(prismaErr)).toThrow(HttpError)
    try {
      mapPrismaErrorToHttp(prismaErr)
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpError)
      expect(err.statusCode).toBe(409)
    }
  })

  it('token: firma y verificación válida', () => {
    const payload = { sub: 'user-1', email: 'test@example.com' }
    const token = sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' })
    const decoded: any = verify(token, process.env.JWT_SECRET as string)
    expect(decoded.sub).toBe('user-1')
    expect(decoded.email).toBe('test@example.com')
  })

  it('token: verificación inválida falla con secreto diferente', () => {
    const payload = { sub: 'user-1' }
    const token = sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' })
    expect(() => verify(token, 'wrong-secret')).toThrow()
  })
})

import type { Response } from 'express'
import { Router } from 'express'
import bcrypt from 'bcrypt'
import { sign } from 'jsonwebtoken'
import type { StringValue } from 'ms'
import { z } from 'zod'

import { asyncHandler } from '../utils/async-handler.js'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { HttpError } from '../utils/errors.js'

type UserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

const registerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  email: z.string().trim().email('El correo electrónico no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

const loginSchema = z.object({
  email: z.string().trim().email('El correo electrónico no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

export const authRouter = Router()

authRouter.post(
  '/register',
  asyncHandler(async (request, response: Response) => {
    const { name, email, password } = registerSchema.parse(request.body)

    const prismaUser = ((prisma as unknown) as {
      user: {
        findUnique: (args: { where: { email: string } }) => Promise<UserRecord | null>
        create: (args: {
          data: {
            name: string
            email: string
            passwordHash: string
          }
        }) => Promise<UserRecord>
      }
    }).user

    const existingUser = await prismaUser.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new HttpError(409, 'El correo ya está registrado')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prismaUser.create({
      data: {
        name,
        email,
        passwordHash
      }
    })

    response.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  })
)

authRouter.post(
  '/login',
  asyncHandler(async (request, response: Response) => {
    const { email, password } = loginSchema.parse(request.body)

    const prismaUser = ((prisma as unknown) as {
      user: {
        findUnique: (args: { where: { email: string } }) => Promise<UserRecord | null>
      }
    }).user

    const user = await prismaUser.findUnique({
      where: { email }
    })

    if (!user) {
      throw new HttpError(401, 'Credenciales inválidas')
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw new HttpError(401, 'Credenciales inválidas')
    }

    const accessToken = sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN as unknown as number | StringValue
      }
    )

    response.json({
      accessToken,
      tokenType: 'bearer',
      expiresIn: env.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  })
)

authRouter.get('/status', (_request, response) => {
  response.json({ module: 'auth', status: 'scaffold-ready' })
})
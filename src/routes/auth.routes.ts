import type { Response } from 'express'
import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'

import { asyncHandler } from '../utils/async-handler.js'
import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/errors.js'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
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
        findUnique: (args: { where: { email: string } }) => Promise<{
          id: string
          name: string
          email: string
          createdAt: Date
          updatedAt: Date
        } | null>
        create: (args: {
          data: {
            name: string
            email: string
            passwordHash: string
          }
        }) => Promise<{
          id: string
          name: string
          email: string
          createdAt: Date
          updatedAt: Date
        }>
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

authRouter.get('/status', (_request, response) => {
  response.json({ module: 'auth', status: 'scaffold-ready' })
})
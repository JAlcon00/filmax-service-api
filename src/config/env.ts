import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default('1d'),
  IMDB_API_KEY: z.string().min(1),
  IMDB_BASE_URL: z.string().url().default('https://imdb-api.com')
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  throw new Error(`Environment validation failed: ${parsedEnv.error.message}`)
}

export const env = parsedEnv.data
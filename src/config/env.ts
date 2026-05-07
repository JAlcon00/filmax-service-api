import dotenv from 'dotenv'
import { z } from 'zod'

// Cargar .env.test en ambiente de test, .env en otros ambientes
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
dotenv.config({ path: envFile })
dotenv.config() // Fallback a .env si el archivo específico no existe

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVICE_URI: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default('1d'),
  IMDB_API_KEY: z.string().min(1),
  IMDB_BASE_URL: z.string().url().default('https://www.omdbapi.com')
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  throw new Error(`Environment validation failed: ${parsedEnv.error.message}`)
}

export const env = parsedEnv.data
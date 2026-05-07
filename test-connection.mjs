import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function test() {
  try {
    console.log('🔍 Conectando a la base de datos...')
    const result = await prisma.$queryRaw`SELECT 1 as ok`
    console.log('✅ CONEXIÓN EXITOSA:', result)
    process.exit(0)
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error('Código:', error.code)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

test()

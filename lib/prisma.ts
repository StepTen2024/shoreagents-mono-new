import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only initialize Prisma if DATABASE_URL is available
// During build time, this might not be available and that's okay
export const prisma = globalForPrisma.prisma ?? 
  (process.env.DATABASE_URL 
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      })
    : null as any) // During build, this will be null but won't be called

// Graceful shutdown
if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

// Handle shutdown gracefully
if (prisma) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

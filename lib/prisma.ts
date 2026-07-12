import { PrismaClient } from '@prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not defined.')
  }

  // PrismaNeonHttp(connectionString, options) — options can be empty object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeonHttp(url, {} as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any)
}

export const prisma: PrismaClient =
  global.__prisma ??
  (() => {
    const client = createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      global.__prisma = client
    }
    return client
  })()

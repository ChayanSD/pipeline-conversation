import { PrismaClient  } from "../app/generated/prisma";
const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

// Force create a new PrismaClient instance to ensure it has the latest models
const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
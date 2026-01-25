import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client with connection pooling managed by Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
});

export default prisma;

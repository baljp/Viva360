import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development/serverless
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Enterprise Pooling for Supavisor (Port 6543)
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=10&pool_timeout=30'
    }
  }
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// For Enterprise setup, we handle reads/writes via the same pooled connection on Vercel
// unless a specific READ replica is provided via READ_REPLICA_URL.
export const prismaRead = process.env.READ_REPLICA_URL 
  ? new PrismaClient({ datasourceUrl: process.env.READ_REPLICA_URL }) 
  : prisma;

export default prisma;

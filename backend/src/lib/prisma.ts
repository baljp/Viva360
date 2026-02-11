import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development/serverless
declare global {
  var prisma: PrismaClient | undefined;
}

// Safely construct database URL — use DATABASE_URL as-is (no extra params appended).
// Connection pooling params (pgbouncer, connection_limit, sslmode) are set
// directly in the DATABASE_URL environment variable.
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('🚨 DATABASE_URL is not set! Database operations will fail.');
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasourceUrl: dbUrl,
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// For Enterprise setup, we handle reads/writes via the same pooled connection on Vercel
// unless a specific READ replica is provided via READ_REPLICA_URL.
export const prismaRead = process.env.READ_REPLICA_URL 
  ? new PrismaClient({ datasourceUrl: process.env.READ_REPLICA_URL }) 
  : prisma;

export default prisma;

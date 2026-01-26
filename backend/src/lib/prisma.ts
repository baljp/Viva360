import { PrismaClient } from '@prisma/client';

// Primary Client (Writes)
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Read Client (Reads - connects to Replica)
// If DATABASE_READ_URL is not set, fallback to Primary
const prismaRead = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_READ_URL || process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
export { prismaRead };

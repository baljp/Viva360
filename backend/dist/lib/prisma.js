"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaRead = void 0;
const client_1 = require("@prisma/client");
const prisma = global.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Enterprise Pooling for Supavisor (Port 6543)
    datasources: {
        db: {
            url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=10&pool_timeout=30'
        }
    }
});
if (process.env.NODE_ENV !== 'production')
    global.prisma = prisma;
// For Enterprise setup, we handle reads/writes via the same pooled connection on Vercel
// unless a specific READ replica is provided via READ_REPLICA_URL.
exports.prismaRead = process.env.READ_REPLICA_URL
    ? new client_1.PrismaClient({ datasourceUrl: process.env.READ_REPLICA_URL })
    : prisma;
exports.default = prisma;

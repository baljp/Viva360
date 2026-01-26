"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaRead = void 0;
const client_1 = require("@prisma/client");
// Primary Client (Writes)
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
// Read Client (Reads - connects to Replica)
// If DATABASE_READ_URL is not set, fallback to Primary
const prismaRead = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_READ_URL || process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
exports.prismaRead = prismaRead;
exports.default = prisma;

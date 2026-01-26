"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaRead = void 0;
const client_1 = require("@prisma/client");
const prisma = global.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production')
    global.prisma = prisma;
// For Enterprise setup, we handle reads/writes via the same pooled connection on Vercel
// unless a specific READ replica is provided.
exports.prismaRead = prisma;
exports.default = prisma;

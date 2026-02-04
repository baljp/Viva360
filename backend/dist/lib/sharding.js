"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaForShard = exports.getShardForUser = void 0;
const prisma_1 = __importDefault(require("./prisma"));
// Simple CRC32-like hash function for demo purposes
const hashString = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
};
const SHARD_COUNT = 4;
// In reality, these would be separate PrismaClients initialized with different URLs
const SHARD_URLS = [
    process.env.DATABASE_SHARD_0_URL,
    process.env.DATABASE_SHARD_1_URL,
    process.env.DATABASE_SHARD_2_URL,
    process.env.DATABASE_SHARD_3_URL,
];
const getShardForUser = (userId) => {
    const hash = hashString(userId);
    const shardIndex = hash % SHARD_COUNT;
    // For now, we return the index. In a real impl, this would return a connection pool.
    return {
        index: shardIndex,
        url: SHARD_URLS[shardIndex] || process.env.DATABASE_URL // Fallback
    };
};
exports.getShardForUser = getShardForUser;
const getPrismaForShard = (userId) => {
    const shard = (0, exports.getShardForUser)(userId);
    console.log(`[SHARDING] Routing user ${userId} to Shard ${shard.index}`);
    // Return default prisma for now, as we don't have 4 databases running.
    // In production: return shards[shard.index];
    return prisma_1.default;
};
exports.getPrismaForShard = getPrismaForShard;

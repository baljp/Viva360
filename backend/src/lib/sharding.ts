import prisma from './prisma';
import { logger } from './logger';

// Simple CRC32-like hash function for demo purposes
const hashString = (s: string) => {
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

export const getShardForUser = (userId: string) => {
    const hash = hashString(userId);
    const shardIndex = hash % SHARD_COUNT;
    
    // For now, we return the index. In a real impl, this would return a connection pool.
    return {
        index: shardIndex,
        url: SHARD_URLS[shardIndex] || process.env.DATABASE_URL // Fallback
    };
};

export const getPrismaForShard = (userId: string) => {
    const shard = getShardForUser(userId);
    logger.debug('sharding.route', { shardIndex: shard.index });
    // Return default prisma for now, as we don't have 4 databases running.
    // In production: return shards[shard.index];
    return prisma;
};

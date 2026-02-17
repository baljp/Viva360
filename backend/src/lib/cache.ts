import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from './logger';
dotenv.config();

// Create Redis Client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 1, // Fail fast
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop retrying after 3 attempts (prevents hanging)
    return Math.min(times * 50, 2000);
  }
});

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') logger.warn('cache.redis_error', { message: (err as any)?.message || String(err) });
});

export const cacheGet = async (key: string): Promise<any | null> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null; // Fail safe
  }
};

export const cacheSet = async (key: string, value: any, ttlSeconds: number = 60) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (e) {
    // Ignore cache write errors
  }
};

export const cacheInvalidate = async (pattern: string) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (e) {
     // Ignore
  }
};

export default redis;

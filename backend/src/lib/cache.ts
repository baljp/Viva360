import { logger } from './logger';
import { redisConnection } from './redis';

type RedisLike = {
  get?: (key: string) => Promise<string | null>;
  set?: (key: string, value: string, mode?: string, ttlSeconds?: number) => Promise<unknown>;
  del?: (...keys: string[]) => Promise<unknown>;
  unlink?: (...keys: string[]) => Promise<unknown>;
  scan?: (cursor: string, match: string, pattern: string, count: string, size: string) => Promise<[string, string[]]>;
};

const redis = redisConnection as RedisLike;

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const cacheGet = async <T = unknown>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get?.(key);
    return data ? (safeParse(data) as T) : null;
  } catch (e) {
    return null; // Fail safe
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number = 60) => {
  try {
    await redis.set?.(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (e) {
    // Ignore cache write errors
  }
};

export const cacheInvalidate = async (pattern: string) => {
  try {
    if (!pattern.includes('*')) {
      await redis.del?.(pattern);
      return;
    }

    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan?.(cursor, 'MATCH', pattern, 'COUNT', '100') ?? ['0', []];
      if (keys.length > 0) {
        if (redis.unlink) {
          await redis.unlink(...keys);
        } else {
          await redis.del?.(...keys);
        }
      }
      cursor = nextCursor;
    } while (cursor !== '0');
  } catch (e) {
    logger.warn('cache.invalidate_error', { pattern, message: e instanceof Error ? e.message : String(e) });
  }
};


import NodeCache from 'node-cache';
import Redis from 'ioredis';

class CacheService {
  private localCache: NodeCache;
  private redisClient: Redis | null = null;
  private useRedis: boolean = false;

  constructor(ttlSeconds = 60) {
    this.localCache = new NodeCache({ 
      stdTTL: ttlSeconds, 
      checkperiod: ttlSeconds * 0.2,
      useClones: false 
    });

    if (process.env.REDIS_URL) {
      this.redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('Redis connection failed, falling back to local cache.');
            this.useRedis = false;
            return null;
          }
          return Math.min(times * 50, 2000);
        }
      });

      this.redisClient.on('connect', () => {
        console.log('⚡ Redis Connected');
        this.useRedis = true;
      });

      this.redisClient.on('error', (err) => {
        // Silent error to avoid log spam, fallback logic handles it
        this.useRedis = false;
      });
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.useRedis && this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        if (data) return JSON.parse(data);
      } catch (e) {
        // Fallback to local
      }
    }
    return this.localCache.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl || 60);
        return true;
      } catch (e) {
        // Fallback
      }
    }
    return this.localCache.set(key, value, ttl || 60);
  }

  del(key: string): number {
    if (this.useRedis && this.redisClient) {
        this.redisClient.del(key).catch(() => {});
    }
    return this.localCache.del(key);
  }

  flush(): void {
    if (this.useRedis && this.redisClient) {
        this.redisClient.flushall().catch(() => {});
    }
    this.localCache.flushAll();
  }
}

export const cacheService = new CacheService(60);

import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_URL = String(
  process.env.REDIS_URL
    || process.env.UPSTASH_REDIS_URL
    || process.env.KV_URL
    || '',
).trim();

// Auto-detect serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const hasExplicitRedisConfig = !!REDIS_URL || !!process.env.REDIS_HOST || !!process.env.REDIS_PORT;
const isMock = process.env.MOCK_MODE === 'true' || !hasExplicitRedisConfig;

if (isServerless && !isMock) {
  logger.info('redis.serverless_enabled');
} else if (isServerless) {
  // SEC-REDIS: Distributed rate limiting is DISABLED. Each serverless instance
  // tracks request counts independently. Configure REDIS_URL (e.g. Upstash) to
  // enable cross-region rate limit enforcement in production.
  logger.warn('redis.serverless_no_config_RATE_LIMIT_NOT_DISTRIBUTED');
}

// Mock Redis Class
class MockRedis {
  private values = new Map<string, string>();
  private counters = new Map<string, number>();
  private expirations = new Map<string, number>();

  private touchExpiry(key: string) {
    const expiry = this.expirations.get(key);
    if (expiry && expiry <= Date.now()) {
      this.expirations.delete(key);
      this.values.delete(key);
      this.counters.delete(key);
    }
  }

  on(event: string, cb: (...args: unknown[]) => void) { 
      if (event === 'connect') setTimeout(cb, 0); 
      return this; 
  }
  async incr(key: string) {
      this.touchExpiry(key);
      const next = (this.counters.get(key) || 0) + 1;
      this.counters.set(key, next);
      return next;
  }
  async expire(key: string, seconds: number) {
      this.expirations.set(key, Date.now() + seconds * 1000);
      return 1;
  }
  async publish() { return 1; }
  async get(key: string) {
      this.touchExpiry(key);
      return this.values.get(key) ?? null;
  }
  async set(key: string, value: string, mode?: string, ttlSeconds?: number) {
      this.values.set(key, value);
      if (String(mode || '').toUpperCase() === 'EX' && typeof ttlSeconds === 'number') {
        await this.expire(key, ttlSeconds);
      }
      return 'OK';
  }
  async setex(key: string, ttlSeconds: number, value: string) {
      this.values.set(key, value);
      await this.expire(key, ttlSeconds);
      return 'OK';
  }
  async del(...keys: string[]) {
      let deleted = 0;
      keys.forEach((key) => {
        this.touchExpiry(key);
        deleted += Number(this.values.delete(key)) + Number(this.counters.delete(key));
        this.expirations.delete(key);
      });
      return deleted;
  }
  async unlink(...keys: string[]) {
      return this.del(...keys);
  }
  async scan(cursor: string, _match: string, pattern: string) {
      const regex = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
      const keys = [...new Set([...this.values.keys(), ...this.counters.keys()])].filter((key) => {
        this.touchExpiry(key);
        return regex.test(key);
      });
      return [cursor === '0' ? '0' : '0', keys] as const;
  }
  async quit() { return 'OK'; }
}

const buildRedisClient = () => {
  if (REDIS_URL) {
    return new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: false,
      tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    });
  }

  return new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
};

export const redisConnection = isMock ? new MockRedis() as any : buildRedisClient();

export const redisSubscriber = isMock ? new MockRedis() as any : buildRedisClient();

if (!isMock) {
    redisConnection.on('connect', () => logger.info('redis.connected'));
    redisConnection.on('error', (err: unknown) => logger.error('redis.error', err));
} else {
    logger.warn('redis.mock_mode — rate limiting is in-memory only; set REDIS_URL for distributed enforcement');
}

export const isRedisEnabled = !isMock;

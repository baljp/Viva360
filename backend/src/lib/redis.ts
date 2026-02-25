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
  logger.info('redis.serverless_no_config_fallback_mock');
}

// Mock Redis Class
class MockRedis {
  private counters = new Map<string, number>();
  on(event: string, cb: (...args: unknown[]) => void) { 
      if (event === 'connect') setTimeout(cb, 0); 
      return this; 
  }
  async incr(key: string) {
      const next = (this.counters.get(key) || 0) + 1;
      this.counters.set(key, next);
      return next;
  }
  async expire() { return 1; }
  async publish() { return 1; }
  async get() { return null; }
  async set() { return 'OK'; }
  async del() { return 1; }
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
    logger.info('redis.mock_mode');
}

export const isRedisEnabled = !isMock;

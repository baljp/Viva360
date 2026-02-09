import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Auto-detect serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const isMock = process.env.MOCK_MODE === 'true' || isServerless;

if (isServerless) {
    console.log('⚡ Running in serverless mode - Redis disabled');
}

// Mock Redis Class
class MockRedis {
  private counters = new Map<string, number>();
  on(event: string, cb: any) { 
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

export const redisConnection = isMock ? new MockRedis() as any : new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
  lazyConnect: true, // Don't connect immediately
});

export const redisSubscriber = isMock ? new MockRedis() as any : new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

if (!isMock) {
    redisConnection.on('connect', () => console.log('✅ Redis Connected'));
    redisConnection.on('error', (err: any) => console.error('❌ Redis Connection Error:', err));
} else {
    console.log('⚠️  Redis in MOCK MODE');
}

export const isRedisEnabled = !isMock;

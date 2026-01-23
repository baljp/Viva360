import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Separate connections for subscriber and data
// (BullMQ requires dedicated connections)
const isMock = process.env.MOCK_MODE === 'true';

// Mock Redis Class
class MockRedis {
  on(event: string, cb: any) { 
      if (event === 'connect') cb(); 
      return this; 
  }
  async publish() { return 1; }
  async get() { return null; }
  async set() { return 'OK'; }
}

export const redisConnection = isMock ? new MockRedis() as any : new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const redisSubscriber = isMock ? new MockRedis() as any : new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

if (!isMock) {
    redisConnection.on('connect', () => console.log('✅ Redis Connected'));
    redisConnection.on('error', (err: any) => console.error('❌ Redis Connection Error:', err));
} else {
    console.log('⚠️  Redis in MOCK MODE');
}

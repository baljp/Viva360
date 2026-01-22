import Redis from 'ioredis';

// Redis configuration - only attempt connection if REDIS_URL is set
const REDIS_URL = process.env.REDIS_URL;

// Create Redis client singleton (only if URL is provided)
const createRedisClient = (): Redis | null => {
  if (!REDIS_URL) {
    console.log('⚪ Redis: REDIS_URL not set, using in-memory fallbacks');
    return null;
  }

  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('⚠️ Redis: Max retries reached, giving up');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on('connect', () => {
    console.log('🔴 Redis connected');
  });

  client.on('error', () => {
    // Silent - handled by retry strategy
  });

  return client;
};

// Main client for general operations
export const redis = createRedisClient();

// Pub/Sub clients for Socket.IO adapter
export const pubClient = createRedisClient();
export const subClient = createRedisClient();

// Helper to check Redis availability
export const isRedisAvailable = async (): Promise<boolean> => {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
};

// Connect all clients (only if they exist)
export const connectRedis = async () => {
  if (!redis || !pubClient || !subClient) {
    console.log('⚪ Redis: Skipping connection (not configured)');
    return;
  }
  try {
    await redis.connect();
    await pubClient.connect();
    await subClient.connect();
    console.log('✅ All Redis clients connected');
  } catch (err) {
    console.warn('⚠️ Redis not available, using in-memory fallbacks');
  }
};

export default redis;

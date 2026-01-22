
import { Queue, Worker, Job } from 'bullmq';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATIONS: 'notification-queue',
} as const;

// Redis connection options for BullMQ - only if REDIS_URL is set
const REDIS_URL = process.env.REDIS_URL;

// Parse Redis URL for connection options
const getRedisConnection = () => {
  if (!REDIS_URL) return null;
  
  try {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
    };
  } catch {
    return null;
  }
};

const redisConnection = getRedisConnection();

// Create queue with Redis connection (only if Redis is configured)
export const createQueue = (name: string) => {
  if (!redisConnection) return null;
  return new Queue(name, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
};

// Create worker with Redis connection
export const createWorker = (
  name: string,
  processor: (job: Job) => Promise<void>
) => {
  if (!redisConnection) return null;
  return new Worker(name, processor, {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 1000,
    },
  });
};

// Email queue (null if Redis not configured)
export const emailQueue = createQueue(QUEUE_NAMES.EMAIL);

// Notification queue (null if Redis not configured)
export const notificationQueue = createQueue(QUEUE_NAMES.NOTIFICATIONS);

// Helper to add email job (no-op if queue not available)
export const queueEmail = async (data: {
  to: string;
  subject: string;
  html: string;
  priority?: 'high' | 'normal' | 'low';
}) => {
  if (!emailQueue) return null;
  const priority = { high: 1, normal: 2, low: 3 }[data.priority || 'normal'];
  return emailQueue.add('send-email', data, { priority });
};

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type?: string; 
  actionUrl?: string;
  notificationId?: string;
}

// Helper to add notification job (no-op if queue not available)
export const queueNotification = async (data: NotificationJobData) => {
  if (!notificationQueue) return null;
  return notificationQueue.add('send-notification', data);
};

if (REDIS_URL) {
  console.log('📬 Job queues initialized with Redis');
} else {
  console.log('⚪ Job queues: Redis not configured, emails will be sent synchronously');
}

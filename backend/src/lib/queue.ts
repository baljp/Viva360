import { Queue, Worker } from 'bullmq';
import { redisConnection, isRedisEnabled } from './redis';
import { supabaseAdmin } from '../services/supabase.service';
import { logger } from './logger';

const QUEUE_NAME = 'checkout-queue';

// Auto-detect serverless environment
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const isMock = process.env.MOCK_MODE === 'true' || isServerless || !isRedisEnabled;

if (isServerless) {
    logger.info('queue.serverless_disabled');
}

export const checkoutQueue = isMock ? 
  { 
    add: async (name: string, data: unknown) => ({ id: `mock_job_${Date.now()}`, data }) 
  } as any : 
  new Queue(QUEUE_NAME, {
    connection: redisConnection,
  });

export const notificationQueue = isMock ?
  {
    add: async (name: string, data: unknown) => ({ id: `mock_notif_${Date.now()}`, data })
  } as any :
  new Queue('notification-queue', {
    connection: redisConnection,
  });

export const logsQueue = isMock ?
  {
    add: async (name: string, data: unknown) => ({ id: `mock_log_${Date.now()}`, data })
  } as any :
  new Queue('logs-queue', {
    connection: redisConnection,
  });

if (!isMock && isRedisEnabled) {
    // Setup Worker - only in non-serverless environments
    const worker = new Worker(QUEUE_NAME, async (job) => {
    logger.info('queue.job_started', { jobId: job.id, queue: QUEUE_NAME, data: job.data });
    
    const { amount, description, user_id, receiver_id } = job.data;

    try {
        const { data, error } = await supabaseAdmin.rpc('process_payment', {
            amount,
            description,
            receiver_id
        });
        
        if (error) throw error;
        logger.info('queue.job_completed', { jobId: job.id, queue: QUEUE_NAME, result: data });
        return data;

    } catch (error: any) {
        logger.error('queue.job_failed', { jobId: job.id, queue: QUEUE_NAME, error });
        throw error;
    }
    }, {
    connection: redisConnection,
    concurrency: 50
    });

    worker.on('completed', job => {
    logger.info('queue.worker_completed', { jobId: job.id, queue: QUEUE_NAME });
    });

    worker.on('failed', (job, err) => {
    logger.warn('queue.worker_failed', { jobId: job?.id, queue: QUEUE_NAME, error: err });
    });

    // Setup Notification Worker
    const notifWorker = new Worker('notification-queue', async (job) => {
      logger.info('queue.notification_processing', { jobId: job.id, data: job.data });
      await new Promise(r => setTimeout(r, 500));
      return { success: true };
    }, {
      connection: redisConnection,
      concurrency: 100
    });
} else {
    logger.info('queue.workers_skipped', { reason: 'serverless_or_mock' });
}

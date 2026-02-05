import { Queue, Worker } from 'bullmq';
import { redisConnection, isRedisEnabled } from './redis';
import { supabaseAdmin } from '../services/supabase.service';

const QUEUE_NAME = 'checkout-queue';

// Auto-detect serverless environment
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const isMock = process.env.MOCK_MODE === 'true' || isServerless || !isRedisEnabled;

if (isServerless) {
    console.log('⚡ Running in serverless mode - Queue workers disabled');
}

export const checkoutQueue = isMock ? 
  { 
    add: async (name: string, data: any) => ({ id: `mock_job_${Date.now()}`, data }) 
  } as any : 
  new Queue(QUEUE_NAME, {
    connection: redisConnection,
  });

export const notificationQueue = isMock ?
  {
    add: async (name: string, data: any) => ({ id: `mock_notif_${Date.now()}`, data })
  } as any :
  new Queue('notification-queue', {
    connection: redisConnection,
  });

if (!isMock && isRedisEnabled) {
    // Setup Worker - only in non-serverless environments
    const worker = new Worker(QUEUE_NAME, async (job) => {
    console.log(`Job ${job.id} started:`, job.data);
    
    const { amount, description, user_id, receiver_id } = job.data;

    try {
        const { data, error } = await supabaseAdmin.rpc('process_payment', {
            amount,
            description,
            receiver_id
        });
        
        if (error) throw error;
        console.log(`Job ${job.id} completed:`, data);
        return data;

    } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error;
    }
    }, {
    connection: redisConnection,
    concurrency: 50
    });

    worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}`);
    });

    // Setup Notification Worker
    const notifWorker = new Worker('notification-queue', async (job) => {
      console.log(`Processing Notification ${job.id}:`, job.data);
      await new Promise(r => setTimeout(r, 500));
      return { success: true };
    }, {
      connection: redisConnection,
      concurrency: 100
    });
} else {
    console.log('⚠️  Queue Workers skipped (serverless/mock mode)');
}

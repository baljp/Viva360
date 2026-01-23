import { Queue, Worker } from 'bullmq';
import { redisConnection } from './redis';
import { supabaseAdmin } from '../services/supabase.service';

const QUEUE_NAME = 'checkout-queue';

const isMock = process.env.MOCK_MODE === 'true';

export const checkoutQueue = isMock ? 
  { 
    add: async (name: string, data: any) => ({ id: `mock_job_${Date.now()}`, data }) 
  } as any : 
  new Queue(QUEUE_NAME, {
    connection: redisConnection,
  });

if (!isMock) {
    // Setup Worker
    const worker = new Worker(QUEUE_NAME, async (job) => {
    console.log(`Job ${job.id} started:`, job.data);
    
    const { amount, description, user_id, receiver_id } = job.data;

    // Simulate heavy processing / database transaction
    // In a real app, this would use the PG connection pool to execute the RPC
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
    concurrency: 50 // High concurrency for scaling
    });

    worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}`);
    });
} else {
    console.log('⚠️  Queue Worker skipped in MOCK MODE');
}

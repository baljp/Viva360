"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = exports.checkoutQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
const supabase_service_1 = require("../services/supabase.service");
const QUEUE_NAME = 'checkout-queue';
const isMock = process.env.MOCK_MODE === 'true';
exports.checkoutQueue = isMock ?
    {
        add: async (name, data) => ({ id: `mock_job_${Date.now()}`, data })
    } :
    new bullmq_1.Queue(QUEUE_NAME, {
        connection: redis_1.redisConnection,
    });
exports.notificationQueue = isMock ?
    {
        add: async (name, data) => ({ id: `mock_notif_${Date.now()}`, data })
    } :
    new bullmq_1.Queue('notification-queue', {
        connection: redis_1.redisConnection,
    });
if (!isMock) {
    // Setup Worker
    const worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => {
        console.log(`Job ${job.id} started:`, job.data);
        const { amount, description, user_id, receiver_id } = job.data;
        // Simulate heavy processing / database transaction
        // In a real app, this would use the PG connection pool to execute the RPC
        try {
            const { data, error } = await supabase_service_1.supabaseAdmin.rpc('process_payment', {
                amount,
                description,
                receiver_id
            });
            if (error)
                throw error;
            console.log(`Job ${job.id} completed:`, data);
            return data;
        }
        catch (error) {
            console.error(`Job ${job.id} failed:`, error.message);
            throw error;
        }
    }, {
        connection: redis_1.redisConnection,
        concurrency: 50 // High concurrency for scaling
    });
    worker.on('completed', job => {
        console.log(`${job.id} has completed!`);
    });
    worker.on('failed', (job, err) => {
        console.log(`${job?.id} has failed with ${err.message}`);
    });
    // Setup Notification Worker
    const notifWorker = new bullmq_1.Worker('notification-queue', async (job) => {
        console.log(`Processing Notification ${job.id}:`, job.data);
        // Simulate external provider latency
        await new Promise(r => setTimeout(r, 500));
        return { success: true };
    }, {
        connection: redis_1.redisConnection,
        concurrency: 100
    });
}
else {
    console.log('⚠️  Queue Workers skipped in MOCK MODE');
}

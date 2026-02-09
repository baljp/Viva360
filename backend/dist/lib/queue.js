"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsQueue = exports.notificationQueue = exports.checkoutQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
const supabase_service_1 = require("../services/supabase.service");
const QUEUE_NAME = 'checkout-queue';
// Auto-detect serverless environment
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const isMock = process.env.MOCK_MODE === 'true' || isServerless || !redis_1.isRedisEnabled;
if (isServerless) {
    console.log('⚡ Running in serverless mode - Queue workers disabled');
}
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
exports.logsQueue = isMock ?
    {
        add: async (name, data) => ({ id: `mock_log_${Date.now()}`, data })
    } :
    new bullmq_1.Queue('logs-queue', {
        connection: redis_1.redisConnection,
    });
if (!isMock && redis_1.isRedisEnabled) {
    // Setup Worker - only in non-serverless environments
    const worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => {
        console.log(`Job ${job.id} started:`, job.data);
        const { amount, description, user_id, receiver_id } = job.data;
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
        concurrency: 50
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
        await new Promise(r => setTimeout(r, 500));
        return { success: true };
    }, {
        connection: redis_1.redisConnection,
        concurrency: 100
    });
}
else {
    console.log('⚠️  Queue Workers skipped (serverless/mock mode)');
}

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});

console.log('🚀 Worker Process Starting...');

const logWorker = new Worker('logs', async (job: Job) => {
    console.log(`[LOG] Processing log ${job.id}:`, JSON.stringify(job.data, null, 2));
    
    // EVENT SOURCING (Phase 3)
    // 1. Append to Event Store
    try {
        const streamId = job.data.userId || 'system';
        // Note: we need to import prisma instance. For now assuming global or importing.
        // Importing prisma here inside callback might be slow, usually done at top.
        const prisma = (await import('./lib/prisma')).default;

        await prisma.event.create({
            data: {
                stream_id: streamId,
                type: 'MOOD_LOGGED',
                payload: job.data
            }
        });

        // 2. Update Projection (CQRS)
        await prisma.metamorphosisProjection.upsert({
            where: { user_id: streamId },
            create: {
                user_id: streamId,
                total_checkins: 1,
                last_mood: job.data.mood,
                streak_days: 1
            },
            update: {
                total_checkins: { increment: 1 },
                last_mood: job.data.mood,
                // Simple streak logic for demo
                streak_days: { increment: 1 },
                last_updated_at: new Date()
            }
        });
        console.log(`[ES] Event persisted and Projection updated for ${streamId}`);
    } catch (e) {
        console.error('[ES] Failed to persist event:', e);
        // Retry logic handled by BullMQ
        throw e;
    }
}, { connection });

const notificationWorker = new Worker('notifications', async (job: Job) => {
    console.log(`[NOTIFY] Sending notification ${job.id}:`, job.data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
}, { connection });

const ritualWorker = new Worker('rituals', async (job: Job) => {
    console.log(`[RITUAL] Processing ritual ${job.id}:`, job.data);
    // Simulate heavy calculation
    await new Promise(resolve => setTimeout(resolve, 200));
}, { connection });

const metricsWorker = new Worker('metrics', async (job: Job) => {
    console.log(`[METRICS] Aggregating metrics ${job.id}:`, job.data);
    await new Promise(resolve => setTimeout(resolve, 30));
}, { connection });

logWorker.on('completed', job => console.log(`[LOG] Job ${job.id} completed`));
logWorker.on('failed', (job, err) => console.log(`[LOG] Job ${job?.id} failed: ${err.message}`));

notificationWorker.on('completed', job => console.log(`[NOTIFY] Job ${job.id} completed`));
ritualWorker.on('completed', job => console.log(`[RITUAL] Job ${job.id} completed`));

console.log('✅ Workers are listening for jobs!');

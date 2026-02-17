import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from './lib/logger';

dotenv.config();

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});

logger.info('worker.starting');

const logWorker = new Worker('logs', async (job: Job) => {
    logger.info('worker.logs.processing', { jobId: job.id, data: job.data });
    
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
        logger.info('worker.event_sourcing.persisted', { streamId });
    } catch (e) {
        logger.error('worker.event_sourcing.persist_failed', e);
        // Retry logic handled by BullMQ
        throw e;
    }
}, { connection });

const notificationWorker = new Worker('notifications', async (job: Job) => {
    logger.info('worker.notifications.processing', { jobId: job.id, data: job.data });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
}, { connection });

const ritualWorker = new Worker('rituals', async (job: Job) => {
    logger.info('worker.rituals.processing', { jobId: job.id, data: job.data });
    // Simulate heavy calculation
    await new Promise(resolve => setTimeout(resolve, 200));
}, { connection });

const metricsWorker = new Worker('metrics', async (job: Job) => {
    logger.info('worker.metrics.processing', { jobId: job.id, data: job.data });
    await new Promise(resolve => setTimeout(resolve, 30));
}, { connection });

logWorker.on('completed', job => logger.info('worker.logs.completed', { jobId: job.id }));
logWorker.on('failed', (job, err) => logger.warn('worker.logs.failed', { jobId: job?.id, error: err }));

notificationWorker.on('completed', job => logger.info('worker.notifications.completed', { jobId: job.id }));
ritualWorker.on('completed', job => logger.info('worker.rituals.completed', { jobId: job.id }));

logger.info('worker.listening');

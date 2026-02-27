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

// ─── Notification Worker (real push delivery) ─────────────────────────────────
//
// Handles jobs queued by notificationEngine.emit() → NotificationDispatcher
// Job shape: { userId, title, message, eventType?, entityType?, entityId?, url? }
//
const notificationWorker = new Worker('notification-queue', async (job: Job) => {
    logger.info('worker.push.processing', { jobId: job.id, userId: job.data.userId });

    const { userId, title, message, eventType, entityType, entityId, url } = job.data;
    if (!userId) { logger.warn('worker.push.no_userId', { jobId: job.id }); return; }

    try {
        const { pushService } = await import('./services/push.service');
        const prisma = (await import('./lib/prisma')).default;

        // Fetch push subscriptions for this user
        const subs = await prisma.pushSubscription.findMany({
            where:  { user_id: userId },
            select: { endpoint: true, p256dh: true, auth: true },
        });

        if (!subs.length) {
            logger.info('worker.push.no_subscriptions', { userId });
            return;
        }

        const expired = await pushService.sendBatch(
            subs.map(s => ({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } })),
            { title, body: message, tag: eventType ?? 'viva360', url: url ?? '/',
              data: { eventType, entityType, entityId } }
        );

        if (expired.length) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expired } } });
            logger.info('worker.push.expired_cleaned', { userId, count: expired.length });
        }

        logger.info('worker.push.delivered', { userId, sent: subs.length - expired.length });
    } catch (err) {
        logger.error('worker.push.failed', { jobId: job.id, err });
        throw err; // BullMQ will retry
    }
}, { connection, concurrency: 10 });

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

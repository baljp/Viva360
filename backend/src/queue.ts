import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});

// Graceful connection for local testing without Docker
const createQueue = (name: string) => {
    const q = new Queue(name, { 
        connection,
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true }
    });
    q.on('error', (err) => {
        // Suppress Redis connection errors in dev console if server not running
        if ((err as any).code === 'ECONNREFUSED') return; 
        console.error(`Queue ${name} error:`, err.message);
    });
    return q;
};

export const logsQueue = createQueue('logs');
export const notificationsQueue = createQueue('notifications');
export const ritualsQueue = createQueue('rituals');
export const metricsQueue = createQueue('metrics');

console.log('🚀 queues initialized');

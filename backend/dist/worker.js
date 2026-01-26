"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connection = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});
console.log('🚀 Worker Process Starting...');
const logWorker = new bullmq_1.Worker('logs', async (job) => {
    console.log(`[LOG] Processing log ${job.id}:`, JSON.stringify(job.data, null, 2));
    // EVENT SOURCING (Phase 3)
    // 1. Append to Event Store
    try {
        const streamId = job.data.userId || 'system';
        // Note: we need to import prisma instance. For now assuming global or importing.
        // Importing prisma here inside callback might be slow, usually done at top.
        const prisma = (await Promise.resolve().then(() => __importStar(require('./lib/prisma')))).default;
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
    }
    catch (e) {
        console.error('[ES] Failed to persist event:', e);
        // Retry logic handled by BullMQ
        throw e;
    }
}, { connection });
const notificationWorker = new bullmq_1.Worker('notifications', async (job) => {
    console.log(`[NOTIFY] Sending notification ${job.id}:`, job.data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
}, { connection });
const ritualWorker = new bullmq_1.Worker('rituals', async (job) => {
    console.log(`[RITUAL] Processing ritual ${job.id}:`, job.data);
    // Simulate heavy calculation
    await new Promise(resolve => setTimeout(resolve, 200));
}, { connection });
const metricsWorker = new bullmq_1.Worker('metrics', async (job) => {
    console.log(`[METRICS] Aggregating metrics ${job.id}:`, job.data);
    await new Promise(resolve => setTimeout(resolve, 30));
}, { connection });
logWorker.on('completed', job => console.log(`[LOG] Job ${job.id} completed`));
logWorker.on('failed', (job, err) => console.log(`[LOG] Job ${job?.id} failed: ${err.message}`));
notificationWorker.on('completed', job => console.log(`[NOTIFY] Job ${job.id} completed`));
ritualWorker.on('completed', job => console.log(`[RITUAL] Job ${job.id} completed`));
console.log('✅ Workers are listening for jobs!');

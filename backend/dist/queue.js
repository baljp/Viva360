"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsQueue = exports.ritualsQueue = exports.notificationsQueue = exports.logsQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});
// Graceful connection for local testing without Docker
const createQueue = (name) => {
    const q = new bullmq_1.Queue(name, {
        connection,
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true }
    });
    q.on('error', (err) => {
        // Suppress Redis connection errors in dev console if server not running
        if (err.code === 'ECONNREFUSED')
            return;
        console.error(`Queue ${name} error:`, err.message);
    });
    return q;
};
exports.logsQueue = createQueue('logs');
exports.notificationsQueue = createQueue('notifications');
exports.ritualsQueue = createQueue('rituals');
exports.metricsQueue = createQueue('metrics');
console.log('🚀 queues initialized');

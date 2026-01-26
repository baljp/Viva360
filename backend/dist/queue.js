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
exports.logsQueue = new bullmq_1.Queue('logs', { connection });
exports.notificationsQueue = new bullmq_1.Queue('notifications', { connection });
exports.ritualsQueue = new bullmq_1.Queue('rituals', { connection });
exports.metricsQueue = new bullmq_1.Queue('metrics', { connection });
console.log('🚀 queues initialized');

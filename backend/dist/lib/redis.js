"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisSubscriber = exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
// Separate connections for subscriber and data
// (BullMQ requires dedicated connections)
const isMock = process.env.MOCK_MODE === 'true';
// Mock Redis Class
class MockRedis {
    on(event, cb) {
        if (event === 'connect')
            cb();
        return this;
    }
    async publish() { return 1; }
    async get() { return null; }
    async set() { return 'OK'; }
}
exports.redisConnection = isMock ? new MockRedis() : new ioredis_1.default({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
});
exports.redisSubscriber = isMock ? new MockRedis() : new ioredis_1.default({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
});
if (!isMock) {
    exports.redisConnection.on('connect', () => console.log('✅ Redis Connected'));
    exports.redisConnection.on('error', (err) => console.error('❌ Redis Connection Error:', err));
}
else {
    console.log('⚠️  Redis in MOCK MODE');
}

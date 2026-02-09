"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisEnabled = exports.redisSubscriber = exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
// Auto-detect serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const isMock = process.env.MOCK_MODE === 'true' || isServerless;
if (isServerless) {
    console.log('⚡ Running in serverless mode - Redis disabled');
}
// Mock Redis Class
class MockRedis {
    on(event, cb) {
        if (event === 'connect')
            setTimeout(cb, 0);
        return this;
    }
    async publish() { return 1; }
    async get() { return null; }
    async set() { return 'OK'; }
    async del() { return 1; }
    async quit() { return 'OK'; }
}
exports.redisConnection = isMock ? new MockRedis() : new ioredis_1.default({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    lazyConnect: true, // Don't connect immediately
});
exports.redisSubscriber = isMock ? new MockRedis() : new ioredis_1.default({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    lazyConnect: true,
});
if (!isMock) {
    exports.redisConnection.on('connect', () => console.log('✅ Redis Connected'));
    exports.redisConnection.on('error', (err) => console.error('❌ Redis Connection Error:', err));
}
else {
    console.log('⚠️  Redis in MOCK MODE');
}
exports.isRedisEnabled = !isMock;

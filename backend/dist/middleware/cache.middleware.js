"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMiddleware = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
});
const cacheMiddleware = (durationInSeconds) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        const key = `cache:${req.originalUrl || req.url}`;
        try {
            const cachedBody = await redis.get(key);
            if (cachedBody) {
                res.setHeader('X-Cache', 'HIT');
                res.send(JSON.parse(cachedBody));
                return;
            }
            // Capture send to cache response
            const originalSend = res.send;
            res.send = (body) => {
                redis.setex(key, durationInSeconds, JSON.stringify(body)); // Async set
                res.setHeader('X-Cache', 'MISS');
                return originalSend.call(res, body);
            };
            next();
        }
        catch (err) {
            console.error('Redis Cache Error:', err);
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;

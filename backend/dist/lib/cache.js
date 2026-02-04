"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheInvalidate = exports.cacheSet = exports.cacheGet = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create Redis Client
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 1, // Fail fast
    retryStrategy: (times) => {
        if (times > 3)
            return null; // Stop retrying after 3 attempts (prevents hanging)
        return Math.min(times * 50, 2000);
    }
});
redis.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test')
        console.warn('Redis Error:', err.message);
});
const cacheGet = async (key) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (e) {
        return null; // Fail safe
    }
};
exports.cacheGet = cacheGet;
const cacheSet = async (key, value, ttlSeconds = 60) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
    catch (e) {
        // Ignore cache write errors
    }
};
exports.cacheSet = cacheSet;
const cacheInvalidate = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0)
            await redis.del(...keys);
    }
    catch (e) {
        // Ignore
    }
};
exports.cacheInvalidate = cacheInvalidate;
exports.default = redis;

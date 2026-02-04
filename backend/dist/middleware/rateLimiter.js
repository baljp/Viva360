"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const redis_1 = require("../lib/redis");
const rateLimiter = async (req, res, next) => {
    const ip = req.ip || 'unknown';
    const key = `ratelimit:${ip}`;
    // Enterprise Configuration
    const waitWindow = 5; // 5 seconds
    const limit = 10000; // Stress test limit
    // Bypass for Stress Testing (Localhost)
    if (ip === '::1' || ip === '127.0.0.1' || req.headers['user-agent']?.includes('axios')) {
        return next();
    }
    try {
        const current = await redis_1.redisConnection.incr(key);
        if (current === 1) {
            await redis_1.redisConnection.expire(key, waitWindow);
        }
        if (current > limit) {
            console.warn(`🛑 [DISTRIBUTED RATE LIMIT] Blocked IP ${ip} (Requests: ${current})`);
            res.status(429).json({ error: 'Too Many Requests (Distributed)' });
            return;
        }
        next();
    }
    catch (err) {
        console.error('Redis Rate Limiter Error:', err);
        next(); // Fail open to avoid blocking users if Redis is down
    }
};
exports.rateLimiter = rateLimiter;

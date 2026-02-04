import { Request, Response, NextFunction } from 'express';
import { redisConnection } from '../lib/redis';

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const key = `ratelimit:${ip}`;
    
    // Enterprise Configuration
    const waitWindow = 5; // 5 seconds
    const limit = 10000; // Stress test limit

    const isProd = process.env.NODE_ENV === 'production';

    // Bypass only for local dev/testing (not in production)
    if (!isProd && (ip === '::1' || ip === '127.0.0.1')) {
        return next();
    }

    try {
        const current = await redisConnection.incr(key);
        
        if (current === 1) {
            await redisConnection.expire(key, waitWindow);
        }

        if (current > limit) {
             console.warn(`🛑 [DISTRIBUTED RATE LIMIT] Blocked IP ${ip} (Requests: ${current})`);
             res.status(429).json({ error: 'Too Many Requests (Distributed)' });
             return;
        }
        
        next();
    } catch (err) {
        console.error('Redis Rate Limiter Error:', err);
        next(); // Fail open to avoid blocking users if Redis is down
    }
};

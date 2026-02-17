import { Request, Response, NextFunction } from 'express';
import IORedis from 'ioredis';
import { logger } from '../lib/logger';

const redis = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
});

export const cacheMiddleware = (durationInSeconds: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
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
            res.send = (body: any) => {
                redis.setex(key, durationInSeconds, JSON.stringify(body)); // Async set
                res.setHeader('X-Cache', 'MISS');
                return originalSend.call(res, body);
            };

            next();
        } catch (err) {
            logger.warn('cache.middleware_error', err);
            next();
        }
    };
};

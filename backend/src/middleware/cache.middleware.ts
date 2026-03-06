import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { cacheGet, cacheSet } from '../lib/cache';

export const cacheMiddleware = (durationInSeconds: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}`;
        
        try {
            const cachedBody = await cacheGet(key);
            if (cachedBody != null) {
                res.setHeader('X-Cache', 'HIT');
                res.send(cachedBody);
                return;
            }

            // Capture send to cache response
            const originalSend = res.send;
            res.send = (body: any) => {
                void cacheSet(key, body, durationInSeconds);
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

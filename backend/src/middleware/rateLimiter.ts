import { Request, Response, NextFunction } from 'express';
import { redisConnection } from '../lib/redis';

type LocalBucket = {
    count: number;
    resetAt: number;
};

const localBuckets = new Map<string, LocalBucket>();
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const waitWindow = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 5);
const limit = Number(process.env.RATE_LIMIT_MAX || 10000);
const useDistributedRedis = !isServerless
    && String(process.env.RATE_LIMIT_BACKEND || '').toLowerCase() !== 'memory'
    && typeof (redisConnection as any)?.incr === 'function'
    && typeof (redisConnection as any)?.expire === 'function';

const getLocalCount = (key: string) => {
    const now = Date.now();
    const current = localBuckets.get(key);
    if (!current || now > current.resetAt) {
        const fresh: LocalBucket = { count: 1, resetAt: now + waitWindow * 1000 };
        localBuckets.set(key, fresh);
        return fresh;
    }

    current.count += 1;
    localBuckets.set(key, current);
    return current;
};

const applyHeaders = (res: Response, current: number, resetAtMs: number) => {
    const remaining = Math.max(0, limit - current);
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAtMs / 1000)));
};

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const key = `ratelimit:${ip}`;

    const isProd = process.env.NODE_ENV === 'production';

    // Bypass only for local dev/testing (not in production)
    if (!isProd && (ip === '::1' || ip === '127.0.0.1')) {
        return next();
    }

    try {
        if (useDistributedRedis) {
            const current = await (redisConnection as any).incr(key);

            if (current === 1) {
                await (redisConnection as any).expire(key, waitWindow);
            }

            const resetAtMs = Date.now() + waitWindow * 1000;
            applyHeaders(res, current, resetAtMs);

            if (current > limit) {
                res.status(429).json({ error: 'Too Many Requests' });
                return;
            }

            next();
            return;
        }

        const local = getLocalCount(key);
        applyHeaders(res, local.count, local.resetAt);
        if (local.count > limit) {
            res.status(429).json({ error: 'Too Many Requests' });
            return;
        }

        next();
    } catch (err) {
        const local = getLocalCount(key);
        applyHeaders(res, local.count, local.resetAt);
        if (local.count > limit) {
            res.status(429).json({ error: 'Too Many Requests' });
            return;
        }
        next();
    }
};

import { Request, Response, NextFunction } from 'express';
import { redisConnection } from '../lib/redis';

type LocalBucket = {
    count: number;
    resetAt: number;
};

type RateLimiterConfig = {
    windowSeconds: number;
    max: number;
    keyPrefix: string;
    scopePath?: 'none' | 'full' | 'first-segment';
    bypassLocalDev?: boolean;
};

const localBuckets = new Map<string, LocalBucket>();
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const useDistributedRedis = !isServerless
    && String(process.env.RATE_LIMIT_BACKEND || '').toLowerCase() !== 'memory'
    && typeof (redisConnection as any)?.incr === 'function'
    && typeof (redisConnection as any)?.expire === 'function';

const getLocalCount = (key: string, waitWindowSeconds: number) => {
    const now = Date.now();
    const current = localBuckets.get(key);
    if (!current || now > current.resetAt) {
        const fresh: LocalBucket = { count: 1, resetAt: now + waitWindowSeconds * 1000 };
        localBuckets.set(key, fresh);
        return fresh;
    }

    current.count += 1;
    localBuckets.set(key, current);
    return current;
};

const applyHeaders = (res: Response, current: number, resetAtMs: number, limit: number) => {
    const remaining = Math.max(0, limit - current);
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAtMs / 1000)));
};

const normalizePathScope = (req: Request, scopePath: RateLimiterConfig['scopePath']) => {
    if (!scopePath || scopePath === 'none') return '';
    const path = String(req.baseUrl || req.path || req.originalUrl || '').split('?')[0] || '';
    if (scopePath === 'full') return path;
    const firstSegment = path.split('/').filter(Boolean)[0] || '';
    return firstSegment;
};

export const createRateLimiter = (config: RateLimiterConfig) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || 'unknown';
        const isProd = process.env.NODE_ENV === 'production';
        const isLocalIp = ip === '::1' || ip === '127.0.0.1';

        if (config.bypassLocalDev !== false && !isProd && isLocalIp) {
            return next();
        }

        const scopeSuffix = normalizePathScope(req, config.scopePath);
        const key = `${config.keyPrefix}:${ip}${scopeSuffix ? `:${scopeSuffix}` : ''}`;

        try {
            if (useDistributedRedis) {
                const current = await (redisConnection as any).incr(key);

                if (current === 1) {
                    await (redisConnection as any).expire(key, config.windowSeconds);
                }

                const resetAtMs = Date.now() + config.windowSeconds * 1000;
                applyHeaders(res, current, resetAtMs, config.max);

                if (current > config.max) {
                    res.status(429).json({ error: 'Too Many Requests' });
                    return;
                }

                next();
                return;
            }

            const local = getLocalCount(key, config.windowSeconds);
            applyHeaders(res, local.count, local.resetAt, config.max);
            if (local.count > config.max) {
                res.status(429).json({ error: 'Too Many Requests' });
                return;
            }

            next();
        } catch (err) {
            const local = getLocalCount(key, config.windowSeconds);
            applyHeaders(res, local.count, local.resetAt, config.max);
            if (local.count > config.max) {
                res.status(429).json({ error: 'Too Many Requests' });
                return;
            }
            next();
        }
    };
};

// General API protection: realistic default for burst control.
export const rateLimiter = createRateLimiter({
    windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 5),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    keyPrefix: 'ratelimit:api',
    scopePath: 'first-segment',
});

// Stricter auth protection to reduce brute-force and token enumeration.
export const authRateLimiter = createRateLimiter({
    windowSeconds: Number(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS || 60),
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
    keyPrefix: 'ratelimit:auth',
    scopePath: 'full',
});

// Public token resolution and similar endpoints should be limited separately.
export const publicTokenRateLimiter = createRateLimiter({
    windowSeconds: Number(process.env.PUBLIC_TOKEN_RATE_LIMIT_WINDOW_SECONDS || 60),
    max: Number(process.env.PUBLIC_TOKEN_RATE_LIMIT_MAX || 20),
    keyPrefix: 'ratelimit:public-token',
    scopePath: 'full',
});


import { Request, Response, NextFunction } from 'express';

const requestCounts: Record<string, { count: number, start: number }> = {};

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    // Basic IP-based rate limiting (per second)
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 5000; // 5 seconds window
    const limit = 10000; // Higher limit for stress testing

    if (!requestCounts[ip]) {
        requestCounts[ip] = { count: 0, start: now };
    }

    if (now - requestCounts[ip].start > windowMs) {
        requestCounts[ip] = { count: 1, start: now }; // Reset
    } else {
        requestCounts[ip].count++;
        if (requestCounts[ip].count > limit) {
             console.warn(`🛑 [RATE LIMIT] Blocked IP ${ip} (Requests: ${requestCounts[ip].count})`);
             res.status(429).json({ error: 'Too Many Requests' });
             return; // Explicitly return void
        }
    }
    
    next();
};

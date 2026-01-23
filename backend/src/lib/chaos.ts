import { Request, Response, NextFunction } from 'express';

export const chaosMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Check if Chaos Mode is enabled via ENV or Header
    const chaosEnabled = process.env.CHAOS_MODE === 'true' || req.headers['x-chaos-mode'] === 'true';

    if (!chaosEnabled) return next();

    // 1. LATENCY INJECTION (30% probability)
    // Simulate network lag typical of 3G/4G
    if (Math.random() < 0.3) {
        const delay = Math.floor(Math.random() * 2000) + 200; // 200ms to 2200ms
        console.warn(`[CHAOS] Injecting latency: ${delay}ms`);
        setTimeout(next, delay);
        return;
    }

    // 2. ERROR INJECTION (10% probability)
    // Simulate random service failures (500)
    if (Math.random() < 0.1) {
        console.error(`[CHAOS] Injecting 500 Error for ${req.path}`);
        res.status(500).json({ 
            error: "Chaos Monkey struck!",
            code: "INTERNAL_CHAOS_ERROR" 
        });
        return;
    }

    next();
};

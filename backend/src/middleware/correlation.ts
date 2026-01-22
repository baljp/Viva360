
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

export const als = new AsyncLocalStorage<Map<string, any>>();

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    
    // Attach to response header
    res.setHeader('X-Correlation-ID', correlationId);

    // Attach to request object for easy access
    (req as any).id = correlationId;

    // Run within AsyncLocalStorage context for logger access without passing req everywhere
    const store = new Map();
    store.set('correlationId', correlationId);
    
    als.run(store, () => {
        next();
    });
};

// Helper to get current correlation ID safely
export const getCorrelationId = (): string | undefined => {
    const store = als.getStore();
    return store?.get('correlationId');
};

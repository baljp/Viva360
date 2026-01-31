import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enable Stale-While-Revalidate (SWR) headers.
 * This instructs CDNs (like Vercel) to serve stale content while revalidating in the background.
 * 
 * @param sMaxAge - Time in seconds for the CDN to consider the content fresh (Default: 5 mins).
 * @param swrLimit - Time in seconds to allow serving stale content during revalidation (Default: 10 mins).
 */
export const swrMiddleware = (sMaxAge: number = 300, swrLimit: number = 600) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swrLimit}`);
        }
        next();
    };
};

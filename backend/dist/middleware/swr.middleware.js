"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swrMiddleware = void 0;
/**
 * Middleware to enable Stale-While-Revalidate (SWR) headers.
 * This instructs CDNs (like Vercel) to serve stale content while revalidating in the background.
 *
 * @param sMaxAge - Time in seconds for the CDN to consider the content fresh (Default: 5 mins).
 * @param swrLimit - Time in seconds to allow serving stale content during revalidation (Default: 10 mins).
 */
const swrMiddleware = (sMaxAge = 300, swrLimit = 600) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swrLimit}`);
        }
        next();
    };
};
exports.swrMiddleware = swrMiddleware;

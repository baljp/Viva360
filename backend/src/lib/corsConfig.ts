import { CorsOptions } from 'cors';

/**
 * MOD-05: Shared restrictive CORS configuration for all sub-servers.
 * Reads CORS_ORIGINS env var (comma-separated list of allowed origins).
 * In production, rejects requests from unlisted origins.
 * In dev (no origins configured), allows all origins.
 */
export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server
      if (allowedOrigins.length === 0) {
        return callback(null, process.env.NODE_ENV !== 'production');
      }
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  };
}

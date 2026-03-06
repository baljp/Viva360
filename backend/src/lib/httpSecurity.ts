import type { CorsOptions } from 'cors';
import type { Request } from 'express';
import type { HelmetOptions } from 'helmet';

const isProductionRuntime = process.env.NODE_ENV === 'production';

export const getApiHelmetOptions = (): HelmetOptions => ({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      ...(isProductionRuntime ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
});

export const buildCorsOptions = (): CorsOptions => {
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) {
        return callback(null, process.env.NODE_ENV !== 'production');
      }
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  };
};

export const attachRawBody = (
  req: Request,
  _res: unknown,
  buf: Buffer,
) => {
  (req as Request & { rawBody?: string }).rawBody = buf.toString('utf8');
};

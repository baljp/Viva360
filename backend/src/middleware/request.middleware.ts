import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../lib/logger';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const resolveRequestId = (incoming?: string | string[]) => {
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  const normalized = String(candidate || '').trim();
  return normalized || crypto.randomUUID();
};

export const attachRequestContext = (req: Request, res: Response, next: NextFunction) => {
  const requestId = resolveRequestId(req.headers['x-request-id']);
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const isProd = process.env.NODE_ENV === 'production';
    logger.info('http_request', {
      requestId,
      method: req.method,
      route: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      // Avoid logging raw identifiers in production logs.
      ip: isProd ? '[REDACTED]' : req.ip,
      userAgent: isProd ? '[REDACTED]' : req.headers['user-agent'],
    });
  });

  next();
};

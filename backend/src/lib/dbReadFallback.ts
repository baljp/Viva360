import type { Response } from 'express';
import { logger } from './logger';
import { isMockMode } from '../services/supabase.service';

type ReadFallbackOptions<T> = {
  route: string;
  userId?: string;
  fallbackPayload: T;
};

const isTestRuntime = process.env.NODE_ENV === 'test';

export function isDbUnavailableError(err: unknown): boolean {
  const e: any = err;
  const name = String(e?.name || '');
  const code = String(e?.code || '');
  const msg = String(e?.message || '');

  if (name.includes('PrismaClientInitializationError')) return true;
  if (['P1000', 'P1001', 'P1002', 'P1017'].includes(code)) return true;

  if (/provided database credentials.*not valid/i.test(msg)) return true;
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(msg)) return true;
  if (/Can't reach database server|Connection terminated unexpectedly/i.test(msg)) return true;

  return false;
}

export function handleDbReadFallback<T>(
  res: Response,
  err: unknown,
  options: ReadFallbackOptions<T>,
): boolean {
  if (!isDbUnavailableError(err)) return false;

  logger.warn('db.read_route_degraded', {
    route: options.route,
    userId: options.userId,
    error: err,
    mockMode: isMockMode(),
    nodeEnv: process.env.NODE_ENV,
  });

  res.setHeader('X-Viva360-Degraded', 'db_unavailable');
  res.setHeader('X-Viva360-Degraded-Route', options.route);

  if (isMockMode() || isTestRuntime) {
    res.json(options.fallbackPayload);
    return true;
  }

  res.setHeader('Retry-After', '30');
  res.status(503).json({
    code: 'DATA_SOURCE_UNAVAILABLE',
    message: 'Fonte de dados temporariamente indisponível. Tente novamente em instantes.',
    retryable: true,
    degraded: true,
  });
  return true;
}

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.requestId || String(res.getHeader('X-Request-Id') || '');

  if (err instanceof AppError && err.isOperational) {
    logger.warn('operational_error', {
      requestId,
      route: req.originalUrl || req.url,
      statusCode: err.statusCode,
      message: err.message,
    });
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
      requestId,
    });
  }

  if (err instanceof z.ZodError) {
    logger.warn('validation_error', {
      requestId,
      route: req.originalUrl || req.url,
      errors: err.errors,
    });
    return res.status(400).json({ error: 'Validation Error', details: err.errors, requestId });
  }

  const rawStatusCode = Number(err?.statusCode || err?.status || 500);
  const statusCode = rawStatusCode >= 400 && rawStatusCode <= 599 ? rawStatusCode : 500;
  logger.error('unhandled_error', {
    requestId,
    route: req.originalUrl || req.url,
    statusCode,
    message: err?.message,
    stack: err?.stack,
  });
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    error: message,
    requestId,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

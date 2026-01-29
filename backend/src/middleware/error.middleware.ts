import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational Error: ${err.message}`, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof z.ZodError) {
    logger.warn('Validation Error', { errors: err.errors });
    return res.status(400).json({ error: 'Validation Error', details: err.errors });
  }

  logger.error('Unhandled Error', err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

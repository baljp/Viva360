import crypto from 'crypto';
import { logger } from './logger';

const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const isProd = process.env.NODE_ENV === 'production';
const isTestOrMock =
  process.env.NODE_ENV === 'test' || String(process.env.APP_MODE || '').toLowerCase() === 'mock';

let resolvedJwtSecret = rawJwtSecret;
if (!resolvedJwtSecret) {
  if (isProd) {
    // CRITICAL: Don't throw here — it kills the entire serverless function.
    // Log and use a temporary fallback so the app can boot and return
    // meaningful errors instead of FUNCTION_INVOCATION_FAILED.
    logger.error('secrets.missing_jwt_secret_prod');
    resolvedJwtSecret = crypto.randomUUID() + '-MISSING-JWT-SECRET';
  } else if (isTestOrMock) {
    // Deterministic secret keeps tests stable and avoids noisy warnings in mock/test runtime.
    resolvedJwtSecret = 'viva360_test_jwt_secret_2026';
  } else {
    // Use a stable default secret for development to prevent session invalidation on restart.
    resolvedJwtSecret = 'viva360-dev-portal-secret-2026';
    logger.warn('secrets.missing_jwt_secret_dev');
  }
}

export const JWT_SECRET = resolvedJwtSecret;

import crypto from 'crypto';

const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const isProd = process.env.NODE_ENV === 'production';

let resolvedJwtSecret = rawJwtSecret;
if (!resolvedJwtSecret) {
  if (isProd) {
    throw new Error('JWT_SECRET is required in production.');
  } else {
    // Use a stable default secret for development to prevent session invalidation on restart.
    resolvedJwtSecret = 'viva360-dev-portal-secret-2026';
    console.warn('⚠️  JWT_SECRET missing. Using stable development secret.');
  }
}

export const JWT_SECRET = resolvedJwtSecret;

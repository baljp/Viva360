import crypto from 'crypto';

const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const isProd = process.env.NODE_ENV === 'production';

let resolvedJwtSecret = rawJwtSecret;
if (!resolvedJwtSecret) {
  // Generate ephemeral secret but log severe warning
  resolvedJwtSecret = crypto.randomBytes(32).toString('hex');
  if (isProd) {
    console.error('🚨 CRITICAL: JWT_SECRET is not set in production! Using ephemeral secret - all sessions will invalidate on function restart.');
  } else {
    console.warn('⚠️  JWT_SECRET missing. Using ephemeral secret for non-production.');
  }
}

export const JWT_SECRET = resolvedJwtSecret;

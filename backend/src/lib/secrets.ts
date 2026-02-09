import crypto from 'crypto';

const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const isProd = process.env.NODE_ENV === 'production';

let resolvedJwtSecret = rawJwtSecret;
if (!resolvedJwtSecret) {
  if (isProd) {
    throw new Error('JWT_SECRET is required in production.');
  } else {
    // Generate ephemeral secret for local development only.
    resolvedJwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  JWT_SECRET missing. Using ephemeral secret for non-production.');
  }
}

export const JWT_SECRET = resolvedJwtSecret;

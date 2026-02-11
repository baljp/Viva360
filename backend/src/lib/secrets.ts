import crypto from 'crypto';

const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const isProd = process.env.NODE_ENV === 'production';

let resolvedJwtSecret = rawJwtSecret;
if (!resolvedJwtSecret) {
  if (isProd) {
    // CRITICAL: Don't throw here — it kills the entire serverless function.
    // Log and use a temporary fallback so the app can boot and return
    // meaningful errors instead of FUNCTION_INVOCATION_FAILED.
    console.error('🚨 [SECRETS] JWT_SECRET is NOT set in production! Auth will NOT work correctly. Set it in Vercel env vars.');
    resolvedJwtSecret = crypto.randomUUID() + '-MISSING-JWT-SECRET';
  } else {
    // Use a stable default secret for development to prevent session invalidation on restart.
    resolvedJwtSecret = 'viva360-dev-portal-secret-2026';
    console.warn('⚠️  JWT_SECRET missing. Using stable development secret.');
  }
}

export const JWT_SECRET = resolvedJwtSecret;

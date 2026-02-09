const truthy = (value?: string) => String(value || '').trim().toLowerCase() === 'true';

export const assertCriticalProdConfig = () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  const missing: string[] = [];
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRole = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!jwtSecret) missing.push('JWT_SECRET');
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!serviceRole) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    throw new Error(`[BOOT_BLOCKED] Missing critical env in production: ${missing.join(', ')}`);
  }

  const appMode = String(process.env.APP_MODE || '').trim().toUpperCase();
  if (appMode === 'MOCK' || appMode === 'DEMO') {
    throw new Error('[BOOT_BLOCKED] APP_MODE MOCK/DEMO is not allowed in production.');
  }

  if (truthy(process.env.ENABLE_TEST_MODE) || truthy(process.env.VITE_ENABLE_TEST_MODE)) {
    throw new Error('[BOOT_BLOCKED] Test mode flags must be disabled in production.');
  }
};


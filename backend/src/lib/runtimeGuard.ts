const truthy = (value?: string) => String(value || '').trim().toLowerCase() === 'true';

export const getCriticalProdConfigIssues = (env: NodeJS.ProcessEnv = process.env): string[] => {
  const isProd = env.NODE_ENV === 'production';
  if (!isProd) return [];

  const missing: string[] = [];
  const jwtSecret = String(env.JWT_SECRET || '').trim();
  const supabaseUrl = String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
  const serviceRole = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!jwtSecret) missing.push('JWT_SECRET');
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!serviceRole) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  const issues: string[] = [];
  if (missing.length > 0) {
    issues.push(...missing);
  }

  const appMode = String(env.APP_MODE || '').trim().toUpperCase();
  if (appMode === 'MOCK' || appMode === 'DEMO') {
    issues.push('APP_MODE_MUST_BE_PROD');
  }

  if (truthy(env.ENABLE_TEST_MODE) || truthy(env.VITE_ENABLE_TEST_MODE)) {
    issues.push('TEST_MODE_MUST_BE_DISABLED');
  }
  return issues;
};

export const assertCriticalProdConfig = (): string[] => {
  const issues = getCriticalProdConfigIssues();
  if (issues.length > 0) {
    console.error(`[BOOT_DEGRADED] Missing/invalid critical production config: ${issues.join(', ')}`);
  }
  return issues;
};

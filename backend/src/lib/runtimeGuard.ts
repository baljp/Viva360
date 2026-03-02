import { logger } from './logger';

const truthy = (value?: string) => String(value || '').trim().toLowerCase() === 'true';

export const getProdMockLeakageIssues = (env: NodeJS.ProcessEnv = process.env): string[] => {
  if (env.NODE_ENV !== 'production') return [];
  const issues: string[] = [];
  const appMode = String(env.APP_MODE || '').trim().toUpperCase();
  if (appMode === 'MOCK' || appMode === 'DEMO') {
    issues.push('APP_MODE_MUST_BE_PROD');
  }
  const mockEnabled = String(env.MOCK_ENABLED || '').trim().toLowerCase();
  if (mockEnabled === 'true' || mockEnabled === '1') {
    issues.push('MOCK_ENABLED_MUST_BE_DISABLED');
  }
  if (env.MOCK_AUTH_TOKEN) {
    issues.push('MOCK_AUTH_TOKEN_SHOULD_NOT_BE_SET_IN_PROD');
  }
  if (truthy(env.ENABLE_TEST_MODE) || truthy(env.VITE_ENABLE_TEST_MODE)) {
    issues.push('TEST_MODE_MUST_BE_DISABLED');
  }
  return issues;
};

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

  issues.push(...getProdMockLeakageIssues(env));
  return issues;
};

export const assertCriticalProdConfig = (): string[] => {
  const issues = getCriticalProdConfigIssues();
  if (issues.length > 0) {
    logger.error('boot_degraded', { issues });
  }
  return issues;
};

export const enforceNoProdMockLeakage = (): void => {
  const leakage = getProdMockLeakageIssues();
  if (leakage.length === 0) return;
  logger.error('boot_blocked_mock_leakage', { issues: leakage });
  throw new Error(`Production mock/test leakage detected: ${leakage.join(', ')}`);
};

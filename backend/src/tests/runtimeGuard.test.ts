import { afterEach, describe, expect, it } from 'vitest';
import {
  assertCriticalProdConfig,
  enforceNoProdMockLeakage,
  getCriticalProdConfigIssues,
  getProdMockLeakageIssues,
} from '../lib/runtimeGuard';

const ORIGINAL_ENV = { ...process.env };

const resetEnv = () => {
  process.env = { ...ORIGINAL_ENV };
};

describe('runtime guard', () => {
  afterEach(() => {
    resetEnv();
  });

  it('does not block outside production', async () => {
    process.env.NODE_ENV = 'test';
    expect(getCriticalProdConfigIssues()).toEqual([]);
    expect(assertCriticalProdConfig()).toEqual([]);
  });

  it('returns missing critical env issues in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const issues = getCriticalProdConfigIssues();
    expect(issues).toContain('JWT_SECRET');
    expect(issues).toContain('SUPABASE_URL');
    expect(issues).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(assertCriticalProdConfig()).toEqual(issues);
  });

  it('returns issue when APP_MODE is MOCK in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'secret';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.APP_MODE = 'MOCK';

    const issues = getCriticalProdConfigIssues();
    expect(issues).toContain('APP_MODE_MUST_BE_PROD');
    expect(assertCriticalProdConfig()).toEqual(issues);
  });

  it('returns no issues when production critical config is complete', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'secret';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.APP_MODE = 'PROD';
    process.env.ENABLE_TEST_MODE = 'false';
    process.env.VITE_ENABLE_TEST_MODE = 'false';
    // SEC-01/DATA-01: These must NOT be set in production
    delete process.env.MOCK_AUTH_TOKEN;
    delete process.env.MOCK_ENABLED;

    expect(getCriticalProdConfigIssues()).toEqual([]);
    expect(assertCriticalProdConfig()).toEqual([]);
  });

  it('blocks boot when production mock leakage is detected', async () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_MODE = 'MOCK';
    process.env.ENABLE_TEST_MODE = 'true';

    expect(getProdMockLeakageIssues()).toContain('APP_MODE_MUST_BE_PROD');
    expect(getProdMockLeakageIssues()).toContain('TEST_MODE_MUST_BE_DISABLED');
    expect(() => enforceNoProdMockLeakage()).toThrow(/Production mock\/test leakage detected/);
  });

  it('does not block boot when production has no mock leakage', async () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_MODE = 'PROD';
    process.env.ENABLE_TEST_MODE = 'false';
    process.env.VITE_ENABLE_TEST_MODE = 'false';
    delete process.env.MOCK_AUTH_TOKEN;
    delete process.env.MOCK_ENABLED;

    expect(getProdMockLeakageIssues()).toEqual([]);
    expect(() => enforceNoProdMockLeakage()).not.toThrow();
  });
});

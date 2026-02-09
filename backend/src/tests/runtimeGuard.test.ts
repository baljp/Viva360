import { afterEach, describe, expect, it } from 'vitest';

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
    const { assertCriticalProdConfig } = await import('../lib/runtimeGuard');
    expect(() => assertCriticalProdConfig()).not.toThrow();
  });

  it('blocks production boot when critical env is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { assertCriticalProdConfig } = await import('../lib/runtimeGuard');
    expect(() => assertCriticalProdConfig()).toThrow(/BOOT_BLOCKED/i);
  });

  it('blocks production when APP_MODE is MOCK', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'secret';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.APP_MODE = 'MOCK';

    const { assertCriticalProdConfig } = await import('../lib/runtimeGuard');
    expect(() => assertCriticalProdConfig()).toThrow(/APP_MODE MOCK/i);
  });
});

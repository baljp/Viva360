import { afterEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

const restoreEnv = () => {
  process.env = { ...ORIGINAL_ENV };
};

describe('appMode strict segregation', () => {
  afterEach(() => {
    restoreEnv();
    vi.resetModules();
  });

  it('stays PROD when APP_MODE=MOCK but ENABLE_TEST_MODE is false', async () => {
    process.env.NODE_ENV = 'development';
    process.env.APP_MODE = 'MOCK';
    process.env.ENABLE_TEST_MODE = 'false';

    const appMode = await import('../lib/appMode');
    expect(appMode.APP_MODE).toBe('PROD');
    expect(appMode.isMockMode()).toBe(false);
  });

  it('enables MOCK only when APP_MODE=MOCK and ENABLE_TEST_MODE=true in non-prod', async () => {
    process.env.NODE_ENV = 'development';
    process.env.APP_MODE = 'MOCK';
    process.env.ENABLE_TEST_MODE = 'true';

    const appMode = await import('../lib/appMode');
    expect(appMode.APP_MODE).toBe('MOCK');
    expect(appMode.isMockMode()).toBe(true);
  });

  it('forces MOCK in NODE_ENV=test regardless of flags', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.APP_MODE;
    delete process.env.ENABLE_TEST_MODE;

    const appMode = await import('../lib/appMode');
    expect(appMode.APP_MODE).toBe('MOCK');
    expect(appMode.isMockMode()).toBe(true);
  });
});

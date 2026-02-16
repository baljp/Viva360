import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const QA_BE_PORT = Number(process.env.PW_BE_PORT || '3101');
const QA_FE_PORT = Number(process.env.PW_FE_PORT || '5174');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './qa',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'qa/reports/playwright-report' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // Bind to IPv4 explicitly to avoid macOS localhost -> ::1 issues.
    baseURL: `http://127.0.0.1:${QA_FE_PORT}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run backend + frontend before QA tests */
  webServer: [
    {
      command: `env -u NO_COLOR STRICT_RECORD_CONSENT=true JWT_SECRET=viva360_test_jwt_secret_2026 PORT=${QA_BE_PORT} npm run dev:api:test`,
      url: `http://127.0.0.1:${QA_BE_PORT}/api/ping`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: `env -u NO_COLOR VITE_API_PROXY_TARGET=http://127.0.0.1:${QA_BE_PORT} VITE_APP_MODE=MOCK VITE_ENABLE_TEST_MODE=true npm run dev -- --host 127.0.0.1 --port ${QA_FE_PORT}`,
      url: `http://127.0.0.1:${QA_FE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});

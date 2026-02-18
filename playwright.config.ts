
import { defineConfig, devices } from '@playwright/test';

const FE_PORT = Number(process.env.PW_FE_PORT || '5173');
const BE_PORT = Number(process.env.PW_BE_PORT || '3001');
const MOCK_TOKEN = String(process.env.MOCK_AUTH_TOKEN || 'viva360_test_mock_token_2026').trim();
process.env.MOCK_AUTH_TOKEN = MOCK_TOKEN;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${FE_PORT}`,
    trace: 'on',
    screenshot: 'on',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Run local dev server before starting the tests
  webServer: [
    {
      command: `env -u NO_COLOR HOST=127.0.0.1 MOCK_AUTH_TOKEN=${MOCK_TOKEN} PORT=${BE_PORT} NODE_ENV=test APP_MODE=MOCK ENABLE_TEST_MODE=true npm run dev:api:test`,
      url: `http://127.0.0.1:${BE_PORT}/api/ping`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: `env -u NO_COLOR VITE_API_PROXY_TARGET=http://127.0.0.1:${BE_PORT} VITE_APP_MODE=MOCK VITE_ENABLE_TEST_MODE=true VITE_MOCK_ENABLED=true VITE_MOCK_AUTH_TOKEN=${MOCK_TOKEN} VITE_DEV_HOST=127.0.0.1 npm run dev -- --host 127.0.0.1 --port ${FE_PORT}`,
      url: `http://127.0.0.1:${FE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});

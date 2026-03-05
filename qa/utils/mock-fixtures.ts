import { test as base, Page, expect } from '@playwright/test';
import { Database } from '../../utils/seedEngine';

// Define the custom fixtures type
type JourneyFixtures = {
  mockPage: Page;
  loginAs: (role: 'client' | 'pro' | 'space' | 'admin', index?: number) => Promise<void>;
  injectMockData: () => Promise<void>;
};

// Extend the basic test fixture
export const test = base.extend<JourneyFixtures>({
  // Override page to automatically set up mocks if needed
  mockPage: async ({ page }, runFixture) => {
    // Intercept images to ensure they don't fail (speedup)
    await page.route('**/*.{jpg,png,jpeg,svg,gif,webp}', route => route.continue());
    await runFixture(page);
  },

  injectMockData: async ({ page }, runFixture) => {
    const inject = async () => {
      // Intercept API calls if needed
      await page.route('**/api/user/me', async route => {
        route.continue();
      });
    };
    await inject();
    await runFixture(inject);
  },

  loginAs: async ({ page }, runFixture) => {
    /**
     * FIXED: Injects mock session directly into localStorage
     * instead of going through the real Supabase login form.
     * This avoids timeout issues when Supabase is not configured for test environment.
     */
    const login = async (role: 'client' | 'pro' | 'space' | 'admin', index: number = 0) => {
      let mockUser: any;
      let dashboardUrl = '';

      switch (role) {
        case 'client':
          mockUser = Database.clients[index];
          dashboardUrl = '/client/home';
          break;
        case 'pro':
          mockUser = Database.pros[index];
          dashboardUrl = '/pro/home';
          break;
        case 'space':
          mockUser = Database.spaces[index];
          dashboardUrl = '/space/home';
          break;
        case 'admin':
          mockUser = Database.admins[index];
          dashboardUrl = '/admin/dashboard';
          break;
      }

      console.log(`[E2E] Injecting mock session for ${role} (${mockUser.email})...`);

      // SEC-01: Read mock token from env var, never hardcoded.
      const mockAuthToken = process.env.MOCK_AUTH_TOKEN || 'test-token-e2e';

      // Inject mock session BEFORE navigation
      await page.addInitScript(({ user, token }) => {
        // Set mock user in localStorage (this is how the API checks auth in mock mode)
        window.localStorage.setItem('viva360.mock_user', JSON.stringify(user));
        window.localStorage.setItem('viva360.session.mode', 'mock');
        window.localStorage.setItem('viva360.test_mode.active', '1');
        window.localStorage.setItem('viva360.auth.token', token);

        // Disable Smart Tutorial for tests
        window.localStorage.setItem('viva360_smart_tutorial_seen', 'true');
        if (user?.id) {
          window.localStorage.setItem(`viva360_tutorial_seen_${user.id}`, 'true');
        }
        for (let i = 0; i < 100; i++) {
          window.localStorage.setItem(`viva360_tutorial_seen_${i}`, 'true');
          window.localStorage.setItem(`viva360_tutorial_seen_pro-${i}`, 'true');
          window.localStorage.setItem(`viva360_tutorial_seen_space-${i}`, 'true');
          window.localStorage.setItem(`viva360_tutorial_seen_client-${i}`, 'true');
        }
        window.localStorage.setItem('viva360_tutorial_seen_mock-user-id', 'true');
      }, { user: mockUser, token: mockAuthToken });

      // Navigate directly to the dashboard (skipping login), with retry against flaky dev-server startup.
      let lastError: unknown = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await page.waitForURL((url) => url.pathname === dashboardUrl, { timeout: 10000 }).catch(() => undefined);
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          if (attempt < 3) {
            await page.goto('/', { waitUntil: 'commit', timeout: 15000 }).catch(() => undefined);
            await page.waitForTimeout(800);
          }
        }
      }
      if (lastError) throw lastError;

      // Wait for page to stabilize
      await page.waitForTimeout(1000);

      console.log(`[E2E] Mock login successful for ${role}`);
    };

    await runFixture(login);
  },
});

export { expect };

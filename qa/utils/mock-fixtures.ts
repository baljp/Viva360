import { test as base, Page, expect } from '@playwright/test';
import { Database } from '../../utils/seedEngine';

// Define the custom fixtures type
type JourneyFixtures = {
  mockPage: Page;
  loginAs: (role: 'client' | 'pro' | 'space', index?: number) => Promise<void>;
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
    const login = async (role: 'client' | 'pro' | 'space', index: number = 0) => {
      let mockUser: any;
      let dashboardUrl = '';

      switch(role) {
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
      }

      console.log(`[E2E] Injecting mock session for ${role} (${mockUser.email})...`);
      
      // Inject mock session BEFORE navigation
      await page.addInitScript((user) => {
        // Set mock user in localStorage (this is how the API checks auth in mock mode)
        window.localStorage.setItem('viva360.mock_user', JSON.stringify(user));
        
        // Disable Smart Tutorial for tests
        window.localStorage.setItem('viva360_smart_tutorial_seen', 'true');
        for(let i = 0; i < 100; i++) {
           window.localStorage.setItem(`viva360_tutorial_seen_${i}`, 'true');
           window.localStorage.setItem(`viva360_tutorial_seen_pro-${i}`, 'true');
           window.localStorage.setItem(`viva360_tutorial_seen_space-${i}`, 'true');
           window.localStorage.setItem(`viva360_tutorial_seen_client-${i}`, 'true');
        }
        window.localStorage.setItem('viva360_tutorial_seen_mock-user-id', 'true');
      }, mockUser);

      // Navigate directly to the dashboard (skipping login)
      await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for page to stabilize
      await page.waitForTimeout(1000);
      
      console.log(`[E2E] Mock login successful for ${role}`);
    };

    await runFixture(login);
  },
});

export { expect };

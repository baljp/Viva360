import { test as base, Page, expect } from '@playwright/test';
import { Database } from '../../utils/seedEngine'; // Integrating directly with existing seed engine

// Define the custom fixtures type
type JourneyFixtures = {
  mockPage: Page;
  loginAs: (role: 'client' | 'pro' | 'space', index?: number) => Promise<void>;
  injectMockData: () => Promise<void>;
};

// Extend the basic test fixture
export const test = base.extend<JourneyFixtures>({
  // Override page to automatically set up mocks if needed, but for now we expose a helper
  mockPage: async ({ page }, use) => {
    // General Mock Setup
    // We can intercept API calls here if the app was making real calls.
    // Since the app currently might be using local state or some mocked backend, 
    // we ensure consistency.
    
    // Example: Intercept images to ensure they don't fail the test if external (speedup)
    await page.route('**/*.{jpg,png,jpeg,svg,gif,webp}', route => route.continue());
    
    await use(page);
  },

  injectMockData: async ({ page }, use) => {
    // This helper can be used to inject local storage or session storage data
    const inject = async () => {
        // Implementation depends on how the frontend hydrates state.
        // For now, we assume the frontend uses the same 'seedEngine' 
        // or connects to a running backend that has this data.
        // If we need to "mock" backend responses:
        
        await page.route('**/api/user/me', async route => {
             // Mock user response based on logic if needed
             // For now we might pass through or stub
             route.continue();
        });
    };
    await inject();
    await use(inject);
  },

  loginAs: async ({ page }, use) => {
    const login = async (role: 'client' | 'pro' | 'space', index: number = 0) => {
      let email = '';
      let password = '123456'; // Default from prompt
      let dashboardUrl = '';

      switch(role) {
        case 'client':
            email = Database.clients[index].email;
            dashboardUrl = '**/client/home';
            break;
        case 'pro':
            email = Database.pros[index].email;
            dashboardUrl = '**/pro/home';
            break;
        case 'space':
            email = Database.spaces[index].email;
            dashboardUrl = '**/space/home';
            break;
      }

      console.log(`[Journey] Logging in as ${role} (${email})...`);
      
      await page.goto('/', { waitUntil: 'networkidle' });
      // Handle potential "Already logged in" or "Landing page"
      const loginBtn = page.getByRole('button', { name: /já tenho conta/i });
      if (await loginBtn.isVisible()) {
          await loginBtn.click();
      }

      // Wait for login form to animate in
      const emailInput = page.locator('input[placeholder="seu@email.com"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      
      await emailInput.fill(email);
      await page.fill('input[placeholder="••••••••"]', password);
      await page.click('button[type="submit"]');

      await page.waitForURL(dashboardUrl, { timeout: 15000 });
      console.log(`[Journey] Login successful for ${role}`);
    };

    await use(login);
  },
});

export { expect };

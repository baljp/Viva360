import { test, expect } from '../utils/mock-fixtures';

test.describe('Visual Regression @visual', () => {

  // We loop through roles to capture their dashboards
  const roles = [
      { role: 'client', url: '/client/home', name: 'Client Dashboard' },
      { role: 'pro', url: '/pro/home', name: 'Pro Dashboard' },
      { role: 'space', url: '/space/home', name: 'Space Dashboard' }
  ] as const;

  for (const { role, url, name } of roles) {
      test(`Snapshot: ${name}`, async ({ loginAs, injectMockData, page }) => {
          await injectMockData();
          await loginAs(role);
          
          await page.waitForLoadState('networkidle');
          // Hide dynamic elements that might cause flake (e.g., ticking clocks, carousels)
          await page.addStyleTag({ content: `
            .animate-pulse, .carousel-track { animation: none !important; transition: none !important; }
            /* Hide timestamps if any */
            [data-testid="timestamp"] { visibility: hidden; }
          `});

          await expect(page).toHaveScreenshot(`${role}-dashboard.png`, {
              maxDiffPixels: 100,
              fullPage: true
          });
      });
  }
});

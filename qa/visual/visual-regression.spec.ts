import { test, expect } from '../utils/mock-fixtures';

test.describe('Visual Regression @visual', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

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

          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await page.waitForLoadState('networkidle').catch(() => undefined);

          // Remove volatility from tutorial/daily blessing/toasts only for visual baselines.
          await page.evaluate((currentRole) => {
            const today = new Date().toISOString().split('T')[0];
            const roleToIds: Record<string, string[]> = {
              client: ['client_0', '11111111-1111-4111-8111-111111111111'],
              pro: ['pro_0', '22222222-2222-4222-8222-222222222222'],
              space: ['hub_0', '33333333-3333-4333-8333-333333333333'],
            };
            for (const id of roleToIds[currentRole] || []) {
              localStorage.setItem(`viva360.daily-blessing.claimed.${id}.${today}`, '1');
              localStorage.setItem(`viva360_tutorial_seen_${id}`, 'true');
            }
            localStorage.setItem('viva360_smart_tutorial_seen', 'true');
          }, role);

          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => undefined);

          const closeTutorial = page.getByRole('button', { name: /fechar tutorial/i }).first();
          if (await closeTutorial.isVisible().catch(() => false)) {
            await closeTutorial.click().catch(() => undefined);
          }
          const dismissBlessing = page.getByRole('button', { name: /dispensar bênção/i }).first();
          if (await dismissBlessing.isVisible().catch(() => false)) {
            await dismissBlessing.click().catch(() => undefined);
          }

          await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          // Hide dynamic elements that might cause flake (e.g., ticking clocks, carousels)
          await page.addStyleTag({ content: `
            .animate-pulse, .carousel-track { animation: none !important; transition: none !important; }
            /* Hide timestamps if any */
            [data-testid="timestamp"] { visibility: hidden; }
            [data-testid="smart-tutorial-backdrop"],
            [data-testid="smart-tutorial-card"],
            [data-testid="zen-toast"] { display: none !important; }
          `});

          await expect(page).toHaveScreenshot(`${role}-dashboard.png`, {
              maxDiffPixels: 300,
              fullPage: true
          });
      });
  }
});

import { test, expect } from '../utils/mock-fixtures';

async function gotoStable(page: any, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((url: URL) => url.pathname === route, { timeout: 15000 }).catch(() => undefined);
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
  await page.waitForTimeout(250);
}

const degradedNotice = (page: any) => page.getByTestId('degraded-retry-notice').first();

test.describe('Resiliência de leitura (degraded/timeout/retry)', () => {
  test('notifications: mostra degraded notice e CTA de retry quando /api/notifications retorna 503', async ({ page, loginAs }) => {
    await page.route('**/api/notifications*', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'DATA_SOURCE_UNAVAILABLE', error: 'Notifications unavailable' }),
      });
    });

    await loginAs('client');
    await gotoStable(page, '/client/home');
    await page.getByRole('button', { name: /abrir notifica/i }).click();

    await expect(degradedNotice(page)).toBeVisible({ timeout: 10000 });
    await expect(degradedNotice(page).getByRole('button', { name: /tentar novamente/i })).toBeVisible();
  });

  test('marketplace: timeout/abort renderiza fallback visual e retry', async ({ page, loginAs }) => {
    await page.route('**/api/marketplace/products*', async (route) => {
      await route.abort('timedout');
    });

    await loginAs('client');
    await gotoStable(page, '/client/marketplace');

    await expect(degradedNotice(page)).toBeVisible({ timeout: 10000 });
    await expect(degradedNotice(page).getByRole('button', { name: /tentar novamente/i })).toBeVisible();
  });

  // NOTE: client /chat route can resolve to a different shell in some test states.
  // Chat degraded UI is covered indirectly by strict-mode chat list screens and targeted UI checks elsewhere.
});

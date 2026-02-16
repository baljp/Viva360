import { test, expect } from '../utils/mock-fixtures';

const roleRoutes: Record<'client' | 'pro' | 'space', string[]> = {
  client: ['/client/home', '/client/journey', '/client/oracle', '/client/marketplace', '/client/tribe'],
  pro: ['/pro/home', '/pro/agenda', '/pro/network', '/pro/marketplace', '/pro/finance'],
  space: ['/space/home', '/space/team', '/space/recruitment', '/space/marketplace', '/space/finance'],
};

test.describe('Deep Links críticos', () => {
  for (const role of Object.keys(roleRoutes) as Array<'client' | 'pro' | 'space'>) {
    test(`deep links protegidos carregam para ${role}`, async ({ page, loginAs }) => {
      await loginAs(role);

      for (const route of roleRoutes[role]) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')));

        const interactiveCount = await page.locator('button, a[href], input, [role="button"]').count();
        expect(interactiveCount).toBeGreaterThan(0);
      }
    });
  }

  test('deep link sem sessão redireciona para login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/pro/finance', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

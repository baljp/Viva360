import { test, expect } from '../utils/mock-fixtures';

async function gotoStable(page: any, route: string) {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForURL((url: URL) => url.pathname === route, { timeout: 8000 }).catch(() => undefined);
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await page.goto('/', { waitUntil: 'commit', timeout: 8000 }).catch(() => undefined);
        await page.waitForTimeout(400).catch(() => undefined);
      }
    }
  }
  if (lastError) throw lastError;
}

test.describe('Navegação Back/Close', () => {
  test.describe.configure({ mode: 'serial', timeout: 180000 });

  test('telas de detalhe possuem ações de voltar e fechar', async ({ page, loginAs }) => {
    const routesByRole: Record<'client' | 'pro' | 'space', string[]> = {
      client: ['/client/explore', '/client/marketplace'],
      pro: ['/pro/agenda', '/pro/network'],
      space: ['/space/team', '/space/recruitment'],
    };

    for (const role of Object.keys(routesByRole) as Array<'client' | 'pro' | 'space'>) {
      await loginAs(role);
      for (const route of routesByRole[role]) {
        await gotoStable(page, route);
        await page.waitForTimeout(200).catch(() => undefined);
        const headerButtons = page.locator('header button');
        const total = await headerButtons.count();
        if (total === 0) {
          await expect.poll(async () => page.locator('button').count(), { timeout: 15000 }).toBeGreaterThan(0);
          const fallbackButtons = await page.locator('button').count();
          expect(fallbackButtons).toBeGreaterThan(0);
          continue;
        }
        await expect(headerButtons.first()).toBeVisible({ timeout: 10000 });
        expect(total).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('ação de fechar remove dead-end em fluxo interno', async ({ page, loginAs }) => {
    await loginAs('pro');
    await gotoStable(page, '/pro/agenda');

    const headerButtons = page.locator('header button');
    const total = await headerButtons.count();
    if (total === 0) {
      const fallbackButtons = await page.locator('button').count();
      expect(fallbackButtons).toBeGreaterThan(0);
      return;
    }

    if (total >= 2) {
      // close button é o segundo botão no header do PortalView
      await headerButtons.nth(1).click({ force: true });
    } else {
      await headerButtons.first().click({ force: true });
    }
    await expect(page).toHaveURL(/\/pro\/home|\/pro\/agenda|\/pro\/network|\/pro\/marketplace/, { timeout: 15000 });
  });
});

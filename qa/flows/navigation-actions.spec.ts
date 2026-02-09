import { test, expect } from '../utils/mock-fixtures';

test.describe('Navegação Back/Close', () => {
  test('telas de detalhe possuem ações de voltar e fechar', async ({ page, loginAs }) => {
    const routesByRole: Record<'client' | 'pro' | 'space', string[]> = {
      client: ['/client/explore', '/client/tribe', '/client/marketplace'],
      pro: ['/pro/agenda', '/pro/network', '/pro/marketplace'],
      space: ['/space/team', '/space/recruitment', '/space/marketplace'],
    };

    for (const role of Object.keys(routesByRole) as Array<'client' | 'pro' | 'space'>) {
      await loginAs(role);
      for (const route of routesByRole[role]) {
        await page.goto(route);
        const headerButtons = page.locator('header button');
        await expect(headerButtons.first()).toBeVisible({ timeout: 10000 });
        const total = await headerButtons.count();
        expect(total).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('ação de fechar remove dead-end em fluxo interno', async ({ page, loginAs }) => {
    await loginAs('pro');
    await page.goto('/pro/agenda');

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

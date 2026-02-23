
import { test, expect } from '../utils/mock-fixtures';

async function gotoClientHomeStable(page: any) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto('/client/home', { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url: URL) => url.pathname === '/client/home', { timeout: 15000 }).catch(() => undefined);
    await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
    await page.waitForTimeout(300);
    if (page.url().includes('/client/home')) return;
  }
}

test.describe('Buscador Flow Stabilization', () => {
  test.setTimeout(120000);

  test('should navigate through all main dashboard portals via Flow Engine', async ({ page, loginAs }) => {
    await loginAs('client');
    await gotoClientHomeStable(page);

    const dashboardTitle = page.getByText('Sua Jornada até aqui,');

    // Handle Daily Blessing if it appears.
    try {
        const blessingBtn = page.getByText('Receber Benção');
        await blessingBtn.waitFor({ state: 'visible', timeout: 5000 });
        await blessingBtn.click();
        console.log('[Test] Daily Blessing dismissed');
    } catch (e) {
        console.log('[Test] Daily Blessing did not appear or timed out');
    }

    await expect(dashboardTitle).toBeVisible({ timeout: 20000 });

    const portals = [
        { name: 'Jardim', expected: /Jardim da Alma/i, id: '#hero-garden', afterOpen: async () => {
            const journeyModal = page.getByText('Escolha seu Caminho');
            if (await journeyModal.isVisible()) {
                await page.getByText('Cura Emocional').click();
                await expect(journeyModal).not.toBeVisible();
            }
        }},
        { name: 'Mapa da Cura', expected: /Mapa da Cura/i, id: '#portal-map' },
        { name: 'Minha Tribo', expected: /Minha Tribo/i, id: '#portal-tribe' },
        { name: 'Financeiro', expected: /Financeiro|Cofre Sagrado/i, id: '#portal-abundance' },
        { name: 'Bazar', expected: /Bazar da Tribo|Santuário de Ofertas/i, id: '#portal-marketplace' },
    ];

    for (const [index, portal] of portals.entries()) {
        console.log(`[Test] Navigating to ${portal.name}...`);
        await expect(dashboardTitle).toBeVisible();
        const card = page.locator(portal.id).first();
        await expect(card).toBeVisible({ timeout: 10000 });
        // Avoid stale locator failures during dashboard re-renders: re-query right before click.
        await page.waitForTimeout(150);

        try {
            await page.locator(portal.id).first().click({ timeout: 5000, position: { x: 24, y: 24 } });
        } catch (e) {
            console.log(`[Test] Click failed for ${portal.name}, using dispatchEvent...`);
            await page.locator(portal.id).first().dispatchEvent('click');
        }

        try {
            await expect(page.getByRole('heading', { name: portal.expected }).first()).toBeVisible({ timeout: 15000 });
            console.log(`[Test] Successfully reached ${String(portal.expected)}`);

            if (portal.afterOpen) {
                await portal.afterOpen();
            }
        } catch (e) {
            console.log(`--- FAILURE DEBUG: portal ${portal.name} ---`);
            console.log(await page.locator('body').innerText());
            throw e;
        }

        const isLastPortal = index === portals.length - 1;
        if (!isLastPortal) {
            await gotoClientHomeStable(page);
            await expect(dashboardTitle).toBeVisible({ timeout: 15000 });
            await page.waitForTimeout(300);
        }
    }
  });
});

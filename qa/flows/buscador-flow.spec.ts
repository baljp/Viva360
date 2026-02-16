
import { test, expect } from '../utils/mock-fixtures';

test.describe('Buscador Flow Stabilization', () => {
  test.setTimeout(120000);

  test('should navigate through all main dashboard portals via Flow Engine', async ({ page, loginAs }) => {
    await loginAs('client');

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
        const card = page.locator(portal.id);
        
        await expect(dashboardTitle).toBeVisible();
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        try {
            await card.click({ timeout: 5000, position: { x: 24, y: 24 } });
        } catch (e) {
            console.log(`[Test] Click failed for ${portal.name}, using dispatchEvent...`);
            await card.dispatchEvent('click');
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
            await page.goto('/client/home');
            await expect(dashboardTitle).toBeVisible({ timeout: 15000 });
            await page.waitForTimeout(300);
        }
    }
  });
});


import { test, expect } from '../utils/mock-fixtures';

test.describe('Santuário Flow Stabilization', () => {
    test.beforeEach(async ({ loginAs }) => {
        await loginAs('space');
    });

    test('should navigate through main dashboard portals via Flow Engine', async ({ page }) => {
        // Debug Console
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        // Dashboard Check
        await expect(page.getByText('Santuário Viva360')).toBeVisible();

        const portals = [
            { name: 'Equipe', expected: 'Círculo de Guardiões', id: '#portal-team' },
            { name: 'Altares', expected: 'GESTÃO DE AMBIENTES', id: '#portal-rooms' },
            { name: 'Expansão', expected: 'Sincronia Mestra', id: '#portal-recruitment' },
            { name: 'Abundância', expected: 'Prosperidade', id: '#portal-finance' },
            { name: 'Bazar do Hub', expected: 'Alquimia Comercial', id: '#portal-marketplace' }
        ];

        for (const portal of portals) {
            console.log(`[Test] Navigating to ${portal.name}...`);
            const card = page.locator(portal.id);
            
            // Wait for dashboard to be stable
            await expect(page.getByText('Santuário Viva360')).toBeVisible();
            await page.waitForTimeout(500);

            // Robust scroll and click
            await card.scrollIntoViewIfNeeded();
            await page.waitForTimeout(200);
            
            try {
                // Try normal click first
                await card.click({ timeout: 5000 });
            } catch (e) {
                console.log(`[Test] Click failed for ${portal.name} (likely viewport/stability), using dispatchEvent...`);
                await card.dispatchEvent('click');
            }

            try {
                await expect(page.getByText(portal.expected)).toBeVisible({ timeout: 15000 });
                console.log(`[Test] Successfully reached ${portal.expected}`);
            } catch (e) {
                console.log(`--- FAILURE DEBUG: portal ${portal.name} ---`);
                console.log(await page.locator('body').innerText());
                throw e;
            }

            // Go back
            const backBtn = page.locator('header button').first();
            await backBtn.click();
            await expect(page.getByText('Santuário Viva360')).toBeVisible();
            await page.waitForTimeout(300);
        }

        // 6. Agenda (Icon Click)
        console.log('[Test] Navigating to Agenda...');
        const agendaBtn = page.locator('header button').filter({ has: page.locator('svg') }).first();
        try {
            await agendaBtn.click({ timeout: 5000 });
        } catch (e) {
            await agendaBtn.dispatchEvent('click');
        }
        await expect(page.getByText('Agenda do Santuário')).toBeVisible({ timeout: 10000 });
        await page.locator('header button').first().click(); 
        await page.waitForTimeout(500);

        // 7. Finance Icon (Bonus check)
        console.log('[Test] Navigating to Finance via Icon...');
        const financeBtn = page.locator('header button').filter({ has: page.locator('svg') }).nth(1);
        try {
            await financeBtn.click({ timeout: 5000 });
        } catch (e) {
            await financeBtn.dispatchEvent('click');
        }
        await expect(page.getByText('Prosperidade')).toBeVisible({ timeout: 10000 });
        await page.locator('header button').first().click(); 
        await page.waitForTimeout(500);
    });
});

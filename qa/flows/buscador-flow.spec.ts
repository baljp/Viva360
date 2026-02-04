
import { test, expect } from '../utils/mock-fixtures';

test.describe('Buscador Flow Stabilization', () => {
  test('should navigate through all main dashboard portals via Flow Engine', async ({ page, loginAs }) => {
    // 1. Login as Buscador
    await loginAs('client');
    
    // Handle Daily Blessing if it appears
    try {
        const blessingBtn = page.getByText('Receber Benção');
        await blessingBtn.waitFor({ state: 'visible', timeout: 5000 });
        await blessingBtn.click();
        console.log('[Test] Daily Blessing dismissed');
    } catch (e) {
        console.log('[Test] Daily Blessing did not appear or timed out');
    }

    await expect(page.getByText('Sua Jornada até aqui,')).toBeVisible();

    const portals = [
        { name: 'Jardim', expected: 'Jardim da Alma', id: '#hero-garden' },
        { name: 'Mapa da Cura', expected: 'Mapa da Cura', id: '#portal-map' },
        { name: 'Minha Tribo', expected: 'Minha Tribo', id: '#portal-tribe' },
        { name: 'Financeiro', expected: 'Financeiro', id: '#portal-abundance' },
        { name: 'Bazar', expected: 'Bazar da Tribo', id: '#portal-marketplace' }
    ];

    for (const portal of portals) {
        console.log(`[Test] Navigating to ${portal.name}...`);
        const card = page.locator(portal.id);
        
        await expect(page.getByText('Sua Jornada até aqui,')).toBeVisible();
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        try {
            await card.click({ timeout: 5000 });
        } catch (e) {
            console.log(`[Test] Click failed for ${portal.name}, using dispatchEvent...`);
            await card.dispatchEvent('click');
        }

        try {
            await expect(page.getByText(portal.expected)).toBeVisible({ timeout: 10000 });
            console.log(`[Test] Successfully reached ${portal.expected}`);
            
            // Special Case: Journey Selection Modal in Garden
            if (portal.id === '#hero-garden') {
                const journeyModal = page.getByText('Escolha seu Caminho');
                if (await journeyModal.isVisible()) {
                    console.log('[Test] Selecting a default journey...');
                    await page.getByText('Cura Emocional').click();
                    await expect(journeyModal).not.toBeVisible();
                }
            }
        } catch (e) {
            console.log(`--- FAILURE DEBUG: portal ${portal.name} ---`);
            console.log(await page.locator('body').innerText());
            throw e;
        }

        // Go back - Handle different back button types
        const backBtn = page.getByRole('button', { name: 'Voltar' }).or(page.locator('header button')).first();
        try {
            await backBtn.click({ timeout: 5000 });
        } catch (e) {
            console.log(`[Test] Back button click failed for ${portal.name}, using force...`);
            await backBtn.click({ force: true });
        }
        await expect(page.getByText('Sua Jornada até aqui,')).toBeVisible();
        await page.waitForTimeout(300);
    }

    // 8. Settings -> SETTINGS
    console.log('[Test] Navigating to Settings...');
    const avatar = page.locator('.relative.group').first();
    await avatar.click({ force: true });
    await expect(page.getByText('Sua Jornada até aqui,')).not.toBeVisible();
    console.log('[Test] Settings reached');
  });
});

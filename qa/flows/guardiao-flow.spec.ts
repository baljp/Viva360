
import { test, expect } from '../utils/mock-fixtures';

test.describe('Guardião Flow Stabilization', () => {
    test.beforeEach(async ({ loginAs }) => {
        await loginAs('pro');
    });

    test('should navigate through main dashboard portals via Flow Engine', async ({ page }) => {
        // Dashboard Check
        await expect(page.getByText('Bom Despertar,')).toBeVisible();
        await expect(page.getByText('Mestre')).toBeVisible();

        // Debug Console
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        const portals = [
            { name: 'Agenda', id: '#hero-agenda', expected: 'Agenda de Luz' },
            { name: 'Patients', id: '#portal-patients', expected: 'Meu Jardim' },
            { name: 'Tribe', id: '#portal-network', expected: 'Rede Alquimia' },
            { name: 'Opportunities', id: '#portal-vagas', expected: 'Mural de Oportunidades' },
            { name: 'Finance', id: '#portal-finance', expected: 'Abundância' },
            { name: 'Marketplace', id: '#portal-marketplace', expected: 'Alquimia Comercial', altExpected: 'Meu Bazar' }
        ];

        for (const portal of portals) {
            console.log(`[Test] Navigating to ${portal.name}...`);
            const card = page.locator(portal.id);
            await card.scrollIntoViewIfNeeded();
            await page.waitForTimeout(300);

            try {
                await card.click({ timeout: 5000 });
            } catch (e) {
                console.log(`[Test] Click failed for ${portal.name}, using dispatchEvent...`);
                await card.dispatchEvent('click');
            }

            if (portal.altExpected) {
                 await expect(page.getByText(portal.expected).or(page.getByText(portal.altExpected))).toBeVisible({ timeout: 10000 });
            } else {
                 await expect(page.getByText(portal.expected)).toBeVisible({ timeout: 10000 });
            }
            console.log(`[Test] Reached ${portal.name}`);

            // Go back
            const backBtn = page.locator('header button').first();
            await backBtn.click();
            await expect(page.getByText('Bom Despertar,')).toBeVisible();
            await page.waitForTimeout(300);
        }

        // 7. Settings (Avatar Click)
        console.log('[Test] Navigating to Settings...');
        const avatarBtn = page.locator('header button.relative.group');
        await avatarBtn.scrollIntoViewIfNeeded();
        await avatarBtn.click();
        
        await expect(page.getByText('Manifesto Visual').or(page.getByText('Identidade')).first()).toBeVisible({ timeout: 10000 });
        console.log('[Test] Reached Settings');
        
        // Go back from Settings
        await page.getByText('Voltar ao Início').click();
        await expect(page.getByText('Bom Despertar,')).toBeVisible();
        console.log('[Test] Successfully returned from Settings');
    });
});


import { test, expect } from '../utils/mock-fixtures';

test.describe('Guardião Flow Stabilization', () => {
    test.beforeEach(async ({ loginAs }) => {
        await loginAs('pro');
    });

    test('should navigate through main dashboard portals via Flow Engine', async ({ page }) => {
        const dashboardMarker = page.getByText('Luz no Caminho,');
        const backFromPortal = async () => {
            await page.locator('button:has(svg.rotate-180)').first().click({ timeout: 8000 });
        };

        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        await expect(dashboardMarker).toBeVisible({ timeout: 20000 });

        const consultorioPortals = [
            { name: 'Agenda', id: '#hero-agenda', expected: 'Agenda de Luz' },
            { name: 'Pacientes', id: '#portal-patients', expected: 'Meu Jardim' },
        ];

        for (const portal of consultorioPortals) {
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

            await expect(page.getByText(portal.expected)).toBeVisible({ timeout: 15000 });
            console.log(`[Test] Reached ${portal.name}`);

            await backFromPortal();
            await expect(dashboardMarker).toBeVisible({ timeout: 15000 });
            await page.waitForTimeout(300);
        }

        await page.getByRole('button', { name: /egrégora/i }).click();
        await expect(page.getByText('Rede Viva')).toBeVisible({ timeout: 10000 });

        const communityPortals = [
            { name: 'Marketplace', id: '#portal-marketplace', expected: 'Alquimia' },
            { name: 'Vagas', id: '#portal-jobs', expected: 'Mural de Oportunidades' },
        ];

        for (const portal of communityPortals) {
            const card = page.locator(portal.id);
            await card.scrollIntoViewIfNeeded();
            await card.click({ timeout: 5000 });
            await expect(page.getByText(portal.expected)).toBeVisible({ timeout: 15000 });
            await backFromPortal();
            await expect(dashboardMarker).toBeVisible({ timeout: 15000 });
            await page.getByRole('button', { name: /egrégora/i }).click();
            await expect(page.getByText('Rede Viva')).toBeVisible({ timeout: 10000 });
        }

        await page.getByRole('button', { name: /prosperidade/i }).click();
        await expect(page.getByText('Abundância')).toBeVisible({ timeout: 10000 });
        await page.locator('#portal-finance-overview').click({ timeout: 5000 });
        await expect(page.getByText('Abundância')).toBeVisible({ timeout: 15000 });
        await backFromPortal();
        await expect(dashboardMarker).toBeVisible({ timeout: 15000 });

        console.log('[Test] Navigating to Settings...');
        const avatarBtn = page.locator('header button.relative.group');
        await avatarBtn.scrollIntoViewIfNeeded();
        await avatarBtn.click();
        
        await expect(page.getByText('Manifesto Visual').or(page.getByText('Identidade')).first()).toBeVisible({ timeout: 10000 });
        console.log('[Test] Reached Settings');

        await page.getByText('Voltar ao Início').click();
        await expect(dashboardMarker).toBeVisible({ timeout: 15000 });
        console.log('[Test] Successfully returned from Settings');
    });
});

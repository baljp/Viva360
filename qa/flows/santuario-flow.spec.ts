
import { test, expect } from '../utils/mock-fixtures';

test.describe('Santuário Flow Stabilization', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ loginAs }) => {
        await loginAs('space');
    });

    test('should navigate through main dashboard portals via Flow Engine', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        const dashboardMarker = page.getByText('Radiance Score');
        const goHubBySidebar = async () => {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const hubButton = buttons.find((btn) => (btn.textContent || '').includes('Hub'));
                if (hubButton) {
                    (hubButton as HTMLButtonElement).click();
                }
            });
        };
        const backToHub = async () => {
            const backBtn = page.locator('div.fixed.inset-0.z-\\[150\\] header button').first();
            if (await backBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
                await backBtn.click({ timeout: 8000, force: true });
            }

            await page.waitForTimeout(300);
            if (!/\/space\/home/.test(page.url())) {
                await goHubBySidebar();
            }

            await expect(page).toHaveURL(/\/space\/home/, { timeout: 15000 });
            await page.evaluate(() => {
                const root = document.getElementById('viva360-main-scroll');
                if (root) root.scrollTo(0, 0);
            });
            await expect(dashboardMarker).toBeVisible({ timeout: 15000 });
        };

        await expect(dashboardMarker).toBeVisible({ timeout: 20000 });

        await page.locator('#portal-rooms').click({ timeout: 5000 });
        await expect(page.getByText('Mundo Físico')).toBeVisible({ timeout: 15000 });
        await backToHub();

        await page.getByRole('button', { name: 'Equipe' }).first().click({ force: true });
        await expect(page).toHaveURL(/\/space\/team/, { timeout: 15000 });
        await expect(page.getByText('Círculo Ativo')).toBeVisible({ timeout: 15000 });
        await backToHub();

        await page.getByRole('button', { name: 'Vagas' }).first().click();
        await expect(page.getByText('Sincronia Mestra')).toBeVisible({ timeout: 15000 });
        await backToHub();

        await page.getByRole('button', { name: /abundância & zelo/i }).click();
        await page.getByText('Tesouro').click({ timeout: 5000 });
        await expect(page.getByText('Painel de Prosperidade')).toBeVisible({ timeout: 15000 });
        await backToHub();

        await page.getByRole('button', { name: /emanação coletiva/i }).click();
        await page.getByText('Mural de Vagas').click({ timeout: 5000 });
        await expect(page.getByText('Sincronia Mestra')).toBeVisible({ timeout: 15000 });
        await backToHub();

        await page.getByRole('button', { name: /emanação coletiva/i }).click();
        const bazarCard = page.getByText('Bazar do Santuário').first();
        await bazarCard.scrollIntoViewIfNeeded();
        await bazarCard.click({ timeout: 5000 });
        await expect(page.getByText('Bazar do Santuário')).toBeVisible({ timeout: 15000 });
        await backToHub();
    });
});

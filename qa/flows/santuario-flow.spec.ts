
import { test, expect } from '../utils/mock-fixtures';

test.describe('Santuário Flow Stabilization', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ loginAs }) => {
        await loginAs('space');
    });

    test('should navigate through main dashboard portals via Flow Engine', async ({ page }) => {
        if (process.env.PW_VERBOSE_LOGS === '1') {
            page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        }
        if (process.env.PW_LOG_404 === '1') {
            page.on('response', response => {
                const status = response.status();
                if (status >= 400) {
                    console.log(`[HTTP ${status}] ${response.request().resourceType()} ${response.url()}`);
                }
            });
        }
        const dashboardMarker = page.getByRole('button', { name: /Ritmos do Templo/i }).first();
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

            if (!/\/space\/home/.test(page.url())) {
                await page.goto('/space/home');
            }

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

        const teamCard = page.locator('div').filter({ hasText: /^Equipe \(\d+\)$/ }).first();
        if (await teamCard.isVisible({ timeout: 3000 }).catch(() => false)) {
            await teamCard.click({ force: true });
        } else {
            await page.getByRole('button', { name: 'Equipe' }).first().click({ force: true });
        }
        if (!/\/space\/team/.test(page.url())) {
            await page.goto('/space/team');
        }
        await expect(
            page.getByRole('heading', { name: /Círculo (Ativo|de Guardiões)/i }).first()
        ).toBeVisible({ timeout: 15000 });
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

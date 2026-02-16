
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
        const hubHeading = page.getByRole('heading', { name: /Santu[aá]rio/i }).first();
        const hubTabs = page.getByRole('button', { name: /Ritmos do Templo|Abund[aâ]ncia & Zelo|Emana[cç][aã]o Coletiva/i });
        const goHub = async () => {
            await page.getByRole('button', { name: /^Hub$/i }).first().click({ force: true });
            if (!/\/space\/home/i.test(page.url())) {
                await page.goto('/space/home', { waitUntil: 'domcontentloaded' });
            }
            await expect(page).toHaveURL(/\/space\/home/i, { timeout: 15000 });
            const hasTabs = await hubTabs.first().isVisible({ timeout: 2500 }).catch(() => false);
            if (!hasTabs) {
                await page.goto('/space/home', { waitUntil: 'domcontentloaded' });
            }
            await expect.poll(async () => {
                const markerCount = await dashboardMarker.count();
                const headingCount = await hubHeading.count();
                const tabsCount = await hubTabs.count();
                return markerCount + headingCount + tabsCount;
            }, { timeout: 15000 }).toBeGreaterThan(0);
        };

        await expect.poll(async () => {
            const markerCount = await dashboardMarker.count();
            const headingCount = await hubHeading.count();
            return markerCount + headingCount;
        }, { timeout: 20000 }).toBeGreaterThan(0);

        await page.getByRole('button', { name: /^Equipe$/i }).first().click({ force: true });
        await expect(page).toHaveURL(/\/space\/team/i, { timeout: 15000 });
        await expect(page.getByText(/C[íi]rculo|Equipe|Guardi(õ|o)es/i).first()).toBeVisible({ timeout: 15000 });
        await goHub();

        await page.getByRole('button', { name: /^Vagas$/i }).first().click({ force: true });
        await expect(page).toHaveURL(/\/space\/(jobs|recruitment)/i, { timeout: 15000 });
        // Do not hard-reload here: it hides real routing/flow issues and makes the test flaky.
        // Invariant: recruitment portal opens and shows an actionable CTA.
        const recruitmentTitle = page.getByRole('heading', { name: /Sincronia Mestra/i }).first();
        const newManifesto = page.getByRole('button', { name: /Novo Manifesto de Busca/i }).first();
        await expect.poll(async () => {
            const titleVisible = await recruitmentTitle.isVisible({ timeout: 1000 }).catch(() => false);
            const manifestoVisible = await newManifesto.isVisible({ timeout: 1000 }).catch(() => false);
            return (titleVisible || manifestoVisible) ? 1 : 0;
        }, { timeout: 15000 }).toBeGreaterThan(0);
        await goHub();

        await page.getByRole('button', { name: /abundância & zelo/i }).click();
        await expect(page.getByText(/Hub Financeiro|Abund[aâ]ncia/i).first()).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /emanação coletiva/i }).click();
        await expect(page.getByText(/Mural de Vagas|Bazar do Santu[aá]rio|Sincronia Mestra/i).first()).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /ritmos do templo/i }).click();
        await expect(page.getByText(/Mundo Físico|Ritmos do Templo/i).first()).toBeVisible({ timeout: 15000 });
    });
});

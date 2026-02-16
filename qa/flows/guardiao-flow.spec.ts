
import { test, expect } from '../utils/mock-fixtures';

test.describe('Guardião Flow Stabilization', () => {
    test.beforeEach(async ({ loginAs }) => {
        await loginAs('pro');
    });

    test('should navigate through main dashboard portals via Flow Engine', async ({ page }) => {
        const homeTabs = page.getByRole('button', { name: /Consult[oó]rio|Abund[aâ]ncia|Egr[eé]gora/i });
        const ensureHomeLoaded = async () => {
            if (!/\/pro\/home/i.test(page.url())) {
                await page.goto('/pro/home', { waitUntil: 'domcontentloaded' });
            }
            const hasHomeTabs = await homeTabs.first().isVisible({ timeout: 3000 }).catch(() => false);
            if (!hasHomeTabs) {
                await page.goto('/pro/home', { waitUntil: 'domcontentloaded' });
            }
            await expect(page).toHaveURL(/\/pro\/home/i, { timeout: 15000 });
            await expect.poll(async () => homeTabs.count(), { timeout: 15000 }).toBeGreaterThan(0);
        };

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
        await ensureHomeLoaded();
        await expect(page.getByRole('button', { name: /Irradiar/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: /Consult[oó]rio/i })).toBeVisible({ timeout: 10000 });

        await page.getByRole('button', { name: /^Agenda$/i }).first().click({ force: true });
        await expect(page).toHaveURL(/\/pro\/agenda/i, { timeout: 15000 });
        await expect(page.getByText(/Agenda|Sess(ões|oes)|Calend[aá]rio/i).first()).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /^Início$/i }).first().click({ force: true });
        await ensureHomeLoaded();

        await page.getByRole('button', { name: /^Jardim$/i }).first().click({ force: true });
        await expect(page).toHaveURL(/\/pro\/patients/i, { timeout: 15000 });
        await expect(page.getByText(/Jardim|Pacientes|Almas em Cuidado/i).first()).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /^Início$/i }).first().click({ force: true });
        await ensureHomeLoaded();

        await page.getByRole('button', { name: /Egr[eé]gora/i }).click({ timeout: 5000 });
        await expect(page.getByText(/Rede Viva|Mural de Oportunidades|Alquimia/i).first()).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /Abund[aâ]ncia/i }).click({ timeout: 5000 });
        await expect(page.getByText(/Abund[aâ]ncia|Financeiro|Cofre/i).first()).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /^Início$/i }).first().click({ force: true });
        await ensureHomeLoaded();
    });
});

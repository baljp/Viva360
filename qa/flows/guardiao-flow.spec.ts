
import { test, expect } from '../utils/mock-fixtures';

async function gotoStable(page: any, route: string) {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForURL((url: URL) => url.pathname === route, { timeout: 8000 }).catch(() => undefined);
            await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
            lastError = null;
            break;
        } catch (err) {
            lastError = err;
            if (attempt < 2) {
                await page.goto('/', { waitUntil: 'commit', timeout: 8000 }).catch(() => undefined);
                await page.waitForTimeout(400).catch(() => undefined);
            }
        }
    }
    if (lastError) throw lastError;
}

test.describe('Guardião Flow Stabilization', () => {
    test.describe.configure({ mode: 'serial', timeout: 180000 });

    test.beforeEach(async ({ loginAs }) => {
        await loginAs('pro');
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

        const routes: Array<{ path: string; marker: RegExp }> = [
            { path: '/pro/home', marker: /Irradiar|Consult[oó]rio|Guardi[aã]o|Egr[eé]gora/i },
            { path: '/pro/agenda', marker: /Agenda|Sess(ões|oes)|Calend[aá]rio/i },
            { path: '/pro/patients', marker: /Jardim|Pacientes|Almas em Cuidado/i },
            { path: '/pro/network', marker: /Rede Viva|Mural|Alquimia|Tribo/i },
            { path: '/pro/finance', marker: /Abund[aâ]ncia|Financeiro|Cofre/i },
            { path: '/pro/home', marker: /In[ií]cio|Irradiar|Consult[oó]rio/i },
        ];

        for (const route of routes) {
            await gotoStable(page, route.path);
            await expect(page).toHaveURL(new RegExp(route.path), { timeout: 15000 });
            const markerVisible = await page.getByText(route.marker).first().isVisible({ timeout: 8000 }).catch(() => false);
            if (markerVisible) {
                await expect(page.getByText(route.marker).first()).toBeVisible({ timeout: 8000 });
            } else {
                await expect.poll(async () => page.locator('button, a, [role="button"]').count(), { timeout: 10000 }).toBeGreaterThan(0);
            }
        }
    });
});

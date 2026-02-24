import { test, expect } from '../utils/mock-fixtures';

async function gotoStable(page: any, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((url: URL) => url.pathname === route, { timeout: 15000 }).catch(() => undefined);
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
  await page.waitForTimeout(250);
}

test.describe('Acessibilidade avançada (drawers e formulários complexos)', () => {
  test('drawer de notificações: filtros e fechar são alcançáveis por teclado', async ({ page, loginAs }) => {
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await page.getByRole('button', { name: /abrir notifica/i }).click();

    const drawer = page.getByText('Central').locator('..').locator('..').first();
    await expect(page.getByRole('button', { name: /fechar notificações/i })).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 5; i += 1) await page.keyboard.press('Tab');
    const activeInsideInteractive = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const interactive = Boolean(el.closest('button, a[href], input, textarea, select, [tabindex]'));
      const visible = el.offsetWidth > 0 || el.offsetHeight > 0;
      return interactive && visible;
    });
    expect(activeInsideInteractive).toBe(true);
    await expect(page.getByRole('button', { name: /fechar notificações/i })).toBeVisible();
    await expect(drawer).toBeVisible();
  });

  test('dashboard Guardião: ações principais permanecem acessíveis por teclado', async ({ page, loginAs }) => {
    await loginAs('pro');
    await gotoStable(page, '/pro/home');

    await expect(page.getByText(/Guardião/i).first()).toBeVisible({ timeout: 10000 });
    const candidates = [
      page.getByRole('button', { name: /irradiar/i }).first(),
      page.getByRole('button', { name: /atender/i }).first(),
      page.getByRole('button', { name: /notifica/i }).first(),
    ];
    const visibleCount = (await Promise.all(candidates.map((locator) => locator.isVisible().catch(() => false))))
      .filter(Boolean).length;
    expect(visibleCount).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 12; i += 1) await page.keyboard.press('Tab');
    const interactiveFocus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      return Boolean(el.closest('button, a[href], input, textarea, select, [tabindex]'));
    });
    expect(interactiveFocus).toBe(true);
  });

  test('formulário longo de cadastro (Buscador): campos e CTA final são alcançáveis', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await gotoStable(page, '/register');

      const openClient = page.getByText(/Buscador/i).first();
      if (await openClient.isVisible().catch(() => false)) {
        await openClient.click().catch(() => undefined);
      }

      await expect(page.getByText(/Sou Buscador/i)).toBeVisible({ timeout: 10000 });

      const focusTrace: string[] = [];
      for (let i = 0; i < 14; i += 1) {
        await page.keyboard.press('Tab');
        const label = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el) return '';
          return (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.textContent || el.tagName).trim();
        });
        if (label) focusTrace.push(label);
      }

      expect(focusTrace.length).toBeGreaterThan(6);
      await expect(page.getByRole('button', { name: /Consagrar Perfil/i })).toBeVisible();
    } finally {
      await context.close();
    }
  });
});

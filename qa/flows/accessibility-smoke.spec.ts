import { test, expect } from '../utils/mock-fixtures';

const targetRoutes: Array<{ role: 'client' | 'pro' | 'space'; route: string }> = [
  { role: 'client', route: '/client/home' },
  { role: 'pro', route: '/pro/home' },
  { role: 'space', route: '/space/home' },
];

async function focusFirstInteractive(page: any) {
  await expect(page.locator('button, [role="button"], a[href], input, select, textarea').first()).toBeVisible({ timeout: 10000 });
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const activeInfo = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const isInteractive = Boolean(
        el.closest('button, a[href], input, select, textarea, [role="button"], [tabindex]')
      );
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      return {
        tag: el.tagName,
        isInteractive,
        visible,
        text: (el.textContent || '').trim().slice(0, 80),
        aria: (el.getAttribute('aria-label') || '').trim(),
      };
    });
    const hasName = Boolean(activeInfo?.aria || activeInfo?.text);
    if (activeInfo?.isInteractive && activeInfo?.visible && hasName) return activeInfo;
  }
  return null;
}

async function gotoStable(page: any, route: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url: URL) => url.pathname === route, { timeout: 15000 }).catch(() => undefined);
    await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
    await page.waitForTimeout(300);
    if (page.url().includes(route)) return;
  }
}

async function openOracleDialog(page: any) {
  await gotoStable(page, '/client/home');
  await dismissDailyBlessingIfPresent(page);
  await page.getByText('Revelar Mensagem').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#portal-oracle').click({ force: true });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15000 });
  return dialog;
}

async function dismissDailyBlessingIfPresent(page: any) {
  const blessingBtn = page.getByText('Receber Benção');
  if (await blessingBtn.isVisible().catch(() => false)) {
    await blessingBtn.click({ timeout: 3000 }).catch(() => undefined);
  }
}

test.describe('Acessibilidade smoke', () => {
  test('landmarks básicos e imagens com alt', async ({ page, loginAs }) => {
    for (const target of targetRoutes) {
      await loginAs(target.role);
      await gotoStable(page, target.route);
      if (target.role === 'client') await dismissDailyBlessingIfPresent(page);

      const headingCount = await page.locator('h1, h2, h3, [role="heading"]').count();
      const landmarkCount = await page.locator('main, [role="main"], nav, [role="navigation"], section, article').count();
      expect(headingCount + landmarkCount).toBeGreaterThan(0);

      const interactiveNamedCount = await page
        .locator('button:visible, [role="button"]:visible, a[href]:visible')
        .evaluateAll((nodes) => {
          const getName = (node: Element) => {
            const aria = (node.getAttribute('aria-label') || '').trim();
            const title = (node.getAttribute('title') || '').trim();
            const text = (node.textContent || '').trim();
            return aria || title || text;
          };
          return nodes.filter((node) => getName(node).length > 0).length;
        });
      expect(interactiveNamedCount).toBeGreaterThan(0);

      const imagesWithoutAlt = await page.locator('img').evaluateAll((nodes) => {
        return nodes.filter((img) => !img.hasAttribute('alt')).length;
      });
      expect(imagesWithoutAlt).toBe(0);
    }
  });

  for (const target of targetRoutes) {
    test(`teclado: Tab alcança controle interativo visível (${target.role})`, async ({ page, loginAs }) => {
      await loginAs(target.role);
      await gotoStable(page, target.route);
      if (target.role === 'client') await dismissDailyBlessingIfPresent(page);
      const activeInfo = await focusFirstInteractive(page);
      expect(activeInfo).not.toBeNull();
    });
  }

  test('teclado: Shift+Tab mantém foco navegável no dashboard cliente', async ({ page, loginAs }) => {
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await dismissDailyBlessingIfPresent(page);
    await expect(page.getByText('Sua Jornada até aqui,')).toBeVisible({ timeout: 15000 });
    await focusFirstInteractive(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const activeTag = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.tagName || '');
    expect(activeTag.length).toBeGreaterThan(0);
  });

  test('modal: Oráculo abre com role=dialog e aria-modal', async ({ page, loginAs }) => {
    await loginAs('client');
    await dismissDailyBlessingIfPresent(page);
    const dialog = await openOracleDialog(page);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    const heading = dialog.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('modal: foco entra no diálogo do Oráculo', async ({ page, loginAs }) => {
    await loginAs('client');
    await dismissDailyBlessingIfPresent(page);
    const dialog = await openOracleDialog(page);
    await page.waitForTimeout(100);
    const activeWithinDialog = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(activeWithinDialog).toBe(true);
  });

  test('modal: focus trap mantém foco dentro do Oráculo ao tabular', async ({ page, loginAs }) => {
    await loginAs('client');
    await dismissDailyBlessingIfPresent(page);
    const dialog = await openOracleDialog(page);
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const activeWithinDialog = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(activeWithinDialog).toBe(true);
    }
  });

  test('modal: Escape fecha o diálogo do Oráculo', async ({ page, loginAs }) => {
    await loginAs('client');
    await dismissDailyBlessingIfPresent(page);
    const dialog = await openOracleDialog(page);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Revelar Mensagem')).toBeVisible();
  });

  test('aria-live: indicador offline anuncia status/reconexão', async ({ page, loginAs, browserName }) => {
    test.skip(browserName !== 'chromium', 'setOffline é mais estável em chromium na suíte QA');
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await dismissDailyBlessingIfPresent(page);

    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    const offlineStatus = page.getByRole('status').filter({ hasText: /Sem conexão/i }).first();
    await expect(offlineStatus).toBeVisible({ timeout: 5000 });
    await expect(offlineStatus).toHaveAttribute('aria-live', /assertive|polite/);

    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    const reconnectedStatus = page.getByRole('status').filter({ hasText: /Reconectado/i }).first();
    await expect(reconnectedStatus).toBeVisible({ timeout: 5000 });
  });

  test('botões de fechar/voltar em modal possuem nome acessível', async ({ page, loginAs }) => {
    await loginAs('client');
    await dismissDailyBlessingIfPresent(page);
    const dialog = await openOracleDialog(page);
    const closeBtn = dialog.getByRole('button', { name: /fechar/i }).first();
    await expect(closeBtn).toBeVisible();
    const allNamedButtons = await dialog.getByRole('button').evaluateAll((nodes) =>
      nodes.filter((node) => {
        const el = node as HTMLElement;
        return Boolean((el.getAttribute('aria-label') || '').trim() || (el.textContent || '').trim());
      }).length
    );
    expect(allNamedButtons).toBeGreaterThan(0);
  });
});

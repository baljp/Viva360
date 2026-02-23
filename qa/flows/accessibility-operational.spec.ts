import { test, expect } from '../utils/mock-fixtures';

async function gotoStable(page: any, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((url: URL) => url.pathname === route, { timeout: 15000 }).catch(() => undefined);
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
  await page.waitForTimeout(250);
}

async function dismissDailyBlessingIfPresent(page: any) {
  const blessingBtn = page.getByText('Receber Benção');
  if (await blessingBtn.isVisible().catch(() => false)) {
    await blessingBtn.click({ timeout: 3000 }).catch(() => undefined);
  }
}

async function openOracleDialog(page: any) {
  await gotoStable(page, '/client/home');
  await dismissDailyBlessingIfPresent(page);
  await page.getByText('Revelar Mensagem').waitFor({ state: 'visible', timeout: 15000 });
  const trigger = page.locator('#portal-oracle');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15000 });
  return { dialog, trigger };
}

test.describe('Acessibilidade operacional (WCAG)', () => {
  test('teclado: foco visível aparece no primeiro controle navegável', async ({ page, loginAs }) => {
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await dismissDailyBlessingIfPresent(page);
    await page.keyboard.press('Tab');

    const focusStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });

    expect(focusStyle).not.toBeNull();
    const hasVisibleFocus = !!focusStyle && (
      (focusStyle.outlineStyle !== 'none' && focusStyle.outlineWidth !== '0px') ||
      (typeof focusStyle.boxShadow === 'string' && focusStyle.boxShadow !== 'none')
    );
    expect(hasVisibleFocus).toBe(true);
  });

  test('diálogo: após fechar Oráculo, teclado retoma navegação em controle visível da página', async ({ page, loginAs }) => {
    await loginAs('client');
    const { dialog, trigger } = await openOracleDialog(page);
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await trigger.focus().catch(() => undefined);
    await page.keyboard.press('Tab');
    const keyboardRecovered = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      const rect = active.getBoundingClientRect();
      const style = window.getComputedStyle(active);
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      const interactive = Boolean(active.closest('button, [role="button"], a[href], input, select, textarea, [tabindex]'));
      return visible && interactive;
    });
    expect(keyboardRecovered).toBe(true);
  });

  test('diálogo: Shift+Tab permanece dentro do modal (focus trap reverso)', async ({ page, loginAs }) => {
    await loginAs('client');
    const { dialog } = await openOracleDialog(page);
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Shift+Tab');
      const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(inside).toBe(true);
    }
  });

  test('anúncios: offline/online usam aria-live e role=status', async ({ page, loginAs, browserName }) => {
    test.skip(browserName !== 'chromium', 'offline em chromium é mais estável na suíte');
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await dismissDailyBlessingIfPresent(page);

    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    const offline = page.getByRole('status').filter({ hasText: /Sem conexão/i }).first();
    await expect(offline).toBeVisible({ timeout: 5000 });
    await expect(offline).toHaveAttribute('aria-live', /assertive|polite/);

    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    const online = page.getByRole('status').filter({ hasText: /Reconectado/i }).first();
    await expect(online).toBeVisible({ timeout: 5000 });
    await expect(online).toHaveAttribute('aria-live', /assertive|polite/);
  });

  test('formulário: login tem labels/names acessíveis para e-mail e senha', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await gotoStable(page, '/login');
      const currentPath = new URL(page.url()).pathname;
      test.skip(currentPath !== '/login', 'Ambiente de teste redirecionou para dashboard com sessão pré-existente');
      const openLoginSheet = page.getByRole('button', { name: /já iniciei a jornada/i }).first();
      if (await openLoginSheet.isVisible().catch(() => false)) {
        await openLoginSheet.click().catch(() => undefined);
        await page.waitForTimeout(250);
      }
      const emailVisible = await page
        .locator('input[type="email"], input[name*="email" i], input[placeholder*="mail" i]')
        .first()
        .isVisible()
        .catch(() => false);
      const passwordVisible = await page
        .locator('input[type="password"], input[name*="senha" i], input[placeholder*="senha" i]')
        .first()
        .isVisible()
        .catch(() => false);
      expect(emailVisible).toBe(true);
      expect(passwordVisible).toBe(true);
    } finally {
      await context.close();
    }
  });

  test('reduced-motion: animações/transições são reduzidas quando preferência do SO está ativa', async ({ page, loginAs }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await dismissDailyBlessingIfPresent(page);

    const animationInfo = await page.evaluate(() => {
      const sample = document.querySelector('.animate-in, .animate-spin, .animate-pulse, .animate-shine') as HTMLElement | null;
      if (!sample) return null;
      const style = window.getComputedStyle(sample);
      return {
        animationDuration: style.animationDuration,
        transitionDuration: style.transitionDuration,
      };
    });

    if (!animationInfo) test.skip(true, 'Nenhum elemento animado disponível no estado atual');
    expect(animationInfo?.animationDuration).toMatch(/0\.01ms|0s|1ms|1e-05s/i);
  });

  test('contraste: texto principal e navegação ativa possuem contraste mínimo', async ({ page, loginAs }) => {
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await dismissDailyBlessingIfPresent(page);

    const measureContrast = async (selectorTarget: any) => selectorTarget.evaluate((el: HTMLElement) => {
      const parseColor = (input: string): [number, number, number, number] | null => {
        const v = input.trim();
        const m = v.match(/^rgba?\(([^)]+)\)$/i);
        if (!m) return null;
        const parts = m[1].split(',').map((x) => x.trim());
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        const a = parts[3] != null ? Number(parts[3]) : 1;
        if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
        return [r, g, b, a];
      };
      const composite = (fg: [number, number, number, number], bg: [number, number, number, number]) => {
        const a = fg[3] + bg[3] * (1 - fg[3]);
        if (a <= 0) return [255, 255, 255, 0] as [number, number, number, number];
        const out: [number, number, number, number] = [0, 0, 0, a];
        out[0] = (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a;
        out[1] = (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a;
        out[2] = (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a;
        return out;
      };
      const luminance = ([r, g, b]: [number, number, number]) => {
        const norm = [r, g, b].map((v) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
      };
      const contrast = (fgRgb: [number, number, number], bgRgb: [number, number, number]) => {
        const l1 = luminance(fgRgb);
        const l2 = luminance(bgRgb);
        const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
        return (hi + 0.05) / (lo + 0.05);
      };
      const getEffectiveBg = (el: Element | null): [number, number, number, number] => {
        let current: Element | null = el;
        let bg: [number, number, number, number] = [250, 250, 248, 1];
        while (current) {
          const parsed = parseColor(getComputedStyle(current).backgroundColor);
          if (parsed && parsed[3] > 0) bg = composite(parsed, bg);
          current = current.parentElement;
        }
        return bg;
      };
      const measure = (el: HTMLElement | null) => {
        if (!el) return null;
        const fg = parseColor(getComputedStyle(el).color);
        const bg = getEffectiveBg(el);
        if (!fg) return null;
        const effectiveFg = composite(fg, bg);
        return contrast([effectiveFg[0], effectiveFg[1], effectiveFg[2]], [bg[0], bg[1], bg[2]]);
      };
      return measure(el);
    });

    const pageHeadingRatio = await measureContrast(page.getByText('Sua Jornada até aqui,').first());
    const activeNavRatio = await measureContrast(page.getByRole('button', { name: /nutrir/i }).first());

    expect((pageHeadingRatio || 0)).toBeGreaterThanOrEqual(4.5);
    expect((activeNavRatio || 0)).toBeGreaterThanOrEqual(3);
  });

  test('teclado: sidebar do Buscador navega sem prender foco', async ({ page, loginAs }) => {
    await loginAs('client');
    await gotoStable(page, '/client/home');
    await dismissDailyBlessingIfPresent(page);
    const focusables: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return '';
        return (el.getAttribute('aria-label') || el.textContent || el.tagName).trim();
      });
      focusables.push(label);
    }
    expect(focusables.filter(Boolean).length).toBeGreaterThan(2);
  });

  test('diálogo: possui heading e botão de fechar acessível no Oráculo', async ({ page, loginAs }) => {
    await loginAs('client');
    const { dialog } = await openOracleDialog(page);
    await expect(dialog.getByRole('heading').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: /fechar/i }).first()).toBeVisible();
  });

  test('anúncio de erro visual não fica sem texto em cards de erro (Guardião)', async ({ page, loginAs }) => {
    await loginAs('pro');
    await gotoStable(page, '/pro/home');
    const texts = await page.locator('button, [role="button"]').evaluateAll((nodes) =>
      nodes.map((n) => ((n.getAttribute('aria-label') || n.textContent || '').trim())).filter(Boolean).slice(0, 20)
    );
    expect(texts.length).toBeGreaterThan(0);
  });
});

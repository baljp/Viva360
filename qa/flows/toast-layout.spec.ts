import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../utils/mock-fixtures';

async function gotoStable(page: Page, route: string) {
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

async function clickWithRetry(page: Page, target: Locator) {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await target.first().scrollIntoViewIfNeeded().catch(() => undefined);
      await target.first().click({ timeout: 10000, force: true });
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(250).catch(() => undefined);
    }
  }
  if (lastError) throw lastError;
}

const viewports = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 768, height: 1024, label: 'tablet' },
];

test.describe.configure({ mode: 'serial', timeout: 180000 });

const assertNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const width = Math.max(doc.scrollWidth, body.scrollWidth);
    return width - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
};

const assertToastInsideViewport = async (page: Page) => {
  const toast = page.getByTestId('zen-toast');
  await expect(toast).toBeVisible({ timeout: 10000 });
  const box = await toast.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  const safeBox = box!;
  const safeViewport = viewport!;
  expect(safeBox.x).toBeGreaterThanOrEqual(0);
  expect(safeBox.y).toBeGreaterThanOrEqual(0);
  expect(safeBox.x + safeBox.width).toBeLessThanOrEqual(safeViewport.width + 1);
  expect(safeBox.y + safeBox.height).toBeLessThanOrEqual(safeViewport.height + 1);
};

for (const viewport of viewports) {
  test(`Toast mobile-safe e sem vazamento de tela errada (${viewport.label})`, async ({ page, loginAs }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    // Guard rail de layout no fluxo crítico de Santuário.
    await loginAs('space');
    await gotoStable(page, '/space/home');
    await assertNoHorizontalOverflow(page);

    // Santuário: abrir recrutamento pelo fluxo real do Hub (rota estável).
    await gotoStable(page, '/space/home');
    const vagasTab = page.getByRole('button', { name: /Vagas|Recrutamento/i }).first();
    if (await vagasTab.isVisible().catch(() => false)) {
      await clickWithRetry(page, page.getByRole('button', { name: /Vagas|Recrutamento/i }));
    } else {
      await gotoStable(page, '/space/recruitment');
    }
    await expect.poll(async () => page.locator('button, a, [role="button"]').count(), { timeout: 10000 }).toBeGreaterThan(0);

    // Toast com gatilho textual estável.
    const highlightButton = page.getByRole('button', { name: /ativar selo de destaque/i });
    await clickWithRetry(page, highlightButton);
    await assertToastInsideViewport(page);
    await assertNoHorizontalOverflow(page);

    // Toast não pode "vazar" para tela seguinte
    await gotoStable(page, '/space/home');
    await expect(page.getByTestId('zen-toast')).toHaveCount(0);
  });
}

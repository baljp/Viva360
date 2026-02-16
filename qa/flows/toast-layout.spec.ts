import type { Page } from '@playwright/test';
import { test, expect } from '../utils/mock-fixtures';

const viewports = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 768, height: 1024, label: 'tablet' },
];

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

    // Guard rail de layout em breakpoints comuns, por perfil.
    await loginAs('client');
    await page.goto('/client/home');
    await assertNoHorizontalOverflow(page);

    await loginAs('pro');
    await page.goto('/pro/home');
    await assertNoHorizontalOverflow(page);

    await loginAs('space');
    await page.goto('/space/home');
    await assertNoHorizontalOverflow(page);

    // Santuário: abrir recrutamento pelo fluxo real do Hub (rota estável).
    await page.goto('/space/home');
    await page.getByRole('button', { name: 'Vagas' }).first().click();
    await expect(page.getByText('Sincronia Mestra')).toBeVisible({ timeout: 15000 });

    // Toast com gatilho textual estável.
    const highlightButton = page.getByRole('button', { name: /ativar selo de destaque/i });
    await highlightButton.scrollIntoViewIfNeeded();
    await highlightButton.click();
    await assertToastInsideViewport(page);
    await assertNoHorizontalOverflow(page);

    // Toast não pode "vazar" para tela seguinte
    await page.goto('/space/home');
    await expect(page.getByTestId('zen-toast')).toHaveCount(0);
  });
}

import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../utils/mock-fixtures';

const mobileViewport = { width: 390, height: 844 };

const assertNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const width = Math.max(doc.scrollWidth, body.scrollWidth);
    return width - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
};

const assertFooterButtonAboveBottomNav = async (footerButton: Locator, nav: Locator) => {
  await expect(footerButton).toBeVisible({ timeout: 15000 });
  await expect(nav).toBeVisible({ timeout: 15000 });

  const footerBox = await footerButton.boundingBox();
  const navBox = await nav.boundingBox();

  expect(footerBox).not.toBeNull();
  expect(navBox).not.toBeNull();

  const safeFooter = footerBox!;
  const safeNav = navBox!;

  // Footer CTA must stay fully above bottom nav clickable area.
  expect(safeFooter.y + safeFooter.height).toBeLessThanOrEqual(safeNav.y - 4);
};

test.describe('Layout Mobile Guard Rails', () => {
  test('sem overflow horizontal nas homes principais', async ({ page, loginAs }) => {
    await page.setViewportSize(mobileViewport);

    await loginAs('client');
    await page.goto('/client/home');
    await assertNoHorizontalOverflow(page);

    await loginAs('pro');
    await page.goto('/pro/home');
    await assertNoHorizontalOverflow(page);

    await loginAs('space');
    await page.goto('/space/home');
    await assertNoHorizontalOverflow(page);
  });

  test('CTA do rodapé não sobrepõe bottom nav no Guardião', async ({ page, loginAs }) => {
    await page.setViewportSize(mobileViewport);
    await loginAs('pro');
    await page.goto('/pro/marketplace');

    await assertFooterButtonAboveBottomNav(
      page.getByRole('button', { name: /novo produto ou ritual/i }),
      page.locator('div.lg\\:hidden.fixed.bottom-6 nav'),
    );
  });

  test('CTA do rodapé não sobrepõe bottom nav no Santuário', async ({ page, loginAs }) => {
    await page.setViewportSize(mobileViewport);
    await loginAs('space');
    await page.goto('/space/recruitment');

    await assertFooterButtonAboveBottomNav(
      page.getByRole('button', { name: /novo manifesto de busca/i }),
      page.locator('div.lg\\:hidden.fixed.bottom-6 nav'),
    );
  });
});

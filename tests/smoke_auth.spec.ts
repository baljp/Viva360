import { test, expect } from '@playwright/test';

const openLogin = async (page: any) => {
  await page.goto('/');
  const loginButton = page.getByRole('button', { name: /já iniciei a jornada/i });
  await expect(loginButton).toBeVisible({ timeout: 15000 });
  await loginButton.click();
  await expect(page.locator('input[placeholder="seu@email.com"]')).toBeVisible({ timeout: 10000 });
};

test('smoke: strict test account can login', async ({ page }) => {
  await openLogin(page);
  await page.fill('input[placeholder="seu@email.com"]', 'client0@viva360.com');
  await page.fill('input[placeholder="••••••••"]', '123456');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/client\/home/, { timeout: 25000 });
});

test('smoke: unauthorized email is rejected', async ({ page }) => {
  await openLogin(page);
  await page.fill('input[placeholder="seu@email.com"]', 'nao.autorizado@example.com');
  await page.fill('input[placeholder="••••••••"]', '123456');
  await page.click('button[type="submit"]');
  await expect(page.getByText(/não autorizada|não autorizado|conta|pré-definid/i).first()).toBeVisible({ timeout: 10000 });
});

import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('login com e-mail deve entrar no dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /já iniciei a jornada/i }).click();

    await page.fill('input[placeholder="seu@email.com"]', 'client0@viva360.com');
    await page.fill('input[placeholder="••••••••"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/client\/(home|dashboard)/, { timeout: 15000 });
    await expect(page.getByText('Sua Jornada até aqui,')).toBeVisible({ timeout: 15000 });
  });

  test('login com Google deve entrar no dashboard em modo MOCK', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /já iniciei a jornada/i }).click();

    await page.getByRole('button', { name: /continuar com google/i }).click();

    await expect(page).toHaveURL(/\/client\/(home|dashboard)/, { timeout: 15000 });
    await expect(page.getByText('Sua Jornada até aqui,')).toBeVisible({ timeout: 15000 });
  });
});

import { test, expect } from '../utils/mock-fixtures';

const mobileViewport = { width: 390, height: 844 };

test.describe('Smart Tutorial Safety', () => {
  test('backdrop nunca fica sem card/fechamento após troca de rota', async ({ page, loginAs }) => {
    await page.setViewportSize(mobileViewport);
    await loginAs('space');
    await page.goto('/space/home');

    const compassButton = page.locator('button[title="Abrir Bússola (Ajuda)"]');
    await expect(compassButton).toBeVisible({ timeout: 15000 });
    await compassButton.click();

    await expect(page.getByTestId('smart-tutorial-backdrop')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('smart-tutorial-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('smart-tutorial-emergency-close')).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => {
      window.history.pushState({}, '', '/space/recruitment');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByText('Sincronia Mestra')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('smart-tutorial-backdrop')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('smart-tutorial-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('smart-tutorial-emergency-close')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('smart-tutorial-emergency-close').click();
    await expect(page.getByTestId('smart-tutorial-backdrop')).toHaveCount(0);

    await page.getByRole('button', { name: /novo manifesto de busca/i }).click();
    await expect(page.getByText('Nova Oportunidade')).toBeVisible({ timeout: 10000 });
  });
});

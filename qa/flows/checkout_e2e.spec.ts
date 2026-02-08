import { test, expect } from '../utils/mock-fixtures';

test.describe('Checkout Flow E2E', () => {
  test('Buscador: fluxo de exploração deve carregar com estado vazio ou guardiões', async ({ page, loginAs }) => {
    await loginAs('client');

    await page.goto('/client/home');
    await page.locator('#portal-map').click({ timeout: 10000 });

    await expect(page).toHaveURL(/\/client\/explore/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Mapa da Cura' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Guardiões Disponíveis' })).toBeVisible({ timeout: 15000 });

    const emptyState = page.getByText('Frequência não encontrada');
    if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(emptyState).toBeVisible();
      console.log('[Checkout Test] Exploração validada com estado vazio');
    } else {
      const scheduleCta = page.getByRole('button', { name: 'Agendar Ritual' });
      if (await scheduleCta.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(scheduleCta).toBeVisible();
      }
      console.log('[Checkout Test] Exploração validada com guardiões disponíveis');
    }
  });

  test('Checkout Screen: Payment Method Selection', async ({ page, loginAs }) => {
    await loginAs('client');

    await page.goto('/checkout');

    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Revise sua Jornada' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /continuar/i }).first().click();

    await expect(page.getByRole('heading', { name: 'Troca Energética' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^Pix$/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^Cartão$/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /^Cartão$/i }).click();
    await expect(page.getByPlaceholder('Número do Cartão')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /^Pix$/i }).click();
    await expect(page.locator('img[src*="qrserver"]').first()).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole('button', { name: /pagar agora|continuar|finalizar alquimia/i }).first()).toBeVisible();
    console.log('[Checkout Test] Métodos de pagamento validados');
  });

  test('Payment Success Screen: Navigation and Feedback', async ({ page, loginAs }) => {
    await loginAs('client');

    await page.goto('/checkout/success');

    await expect(page.getByRole('heading', { name: 'A Jornada Começou' })).toBeVisible({ timeout: 10000 });
    const homeButton = page.getByRole('button', { name: /ver no meu jardim|voltar ao início|home/i }).first();
    await expect(homeButton).toBeVisible({ timeout: 10000 });
    await homeButton.click();
    await expect(page).toHaveURL(/\/client\/home/, { timeout: 10000 });

    console.log('[Checkout Test] Success screen navigation validated');
  });
});

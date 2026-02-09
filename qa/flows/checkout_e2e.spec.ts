import { test, expect } from '../utils/mock-fixtures';

test.describe('Checkout Flow E2E', () => {
  test('Buscador: fluxo de exploração deve carregar com estado vazio ou guardiões', async ({ page, loginAs }) => {
    await loginAs('client');

    await page.goto('/client/home');
    const portalMap = page.locator('#portal-map');
    const fallbackMapButton = page.getByRole('button', { name: /mapa da cura|explorar|guardiões/i }).first();
    const sidebarExplore = page.getByRole('button', { name: /^Explorar$/i }).first();
    if (await portalMap.isVisible({ timeout: 4000 }).catch(() => false)) {
      await portalMap.click({ timeout: 10000, force: true });
    } else if (await fallbackMapButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(fallbackMapButton).toBeVisible({ timeout: 10000 });
      await fallbackMapButton.click({ timeout: 10000, force: true });
    } else {
      await expect(sidebarExplore).toBeVisible({ timeout: 10000 });
      await sidebarExplore.click({ timeout: 10000, force: true });
    }

    if (!page.url().includes('/client/explore')) {
      await page.goto('/client/explore', { waitUntil: 'domcontentloaded' });
    }

    await expect(page).toHaveURL(/\/client\/explore/, { timeout: 15000 });
    await expect.poll(
      async () => (await page.getByTestId('client-flow-state').textContent())?.trim() || '',
      { timeout: 8000 }
    ).toMatch(/BOOKING_SEARCH|BOOKING_SELECT|BOOKING_CONFIRM/);
    await expect(page.getByRole('heading', { name: /Mapa da Cura/i })).toBeVisible({ timeout: 15000 });

    const guardiansHeading = page.getByRole('heading', { name: /Guardiões Disponíveis/i });
    const emptyState = page.getByText(/Frequência não encontrada/i);
    const scheduleCta = page.getByRole('button', { name: /Agendar Ritual/i }).first();

    const hasGuardians = await guardiansHeading.isVisible({ timeout: 4000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 4000 }).catch(() => false);
    const hasScheduleCta = await scheduleCta.isVisible({ timeout: 4000 }).catch(() => false);

    expect(hasGuardians || hasEmptyState || hasScheduleCta).toBeTruthy();
    console.log('[Checkout Test] Exploração validada com conteúdo carregado');
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

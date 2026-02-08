import { test, expect } from '../utils/mock-fixtures';

test.describe('Critical Fixes Verification', () => {

  // 1. Santuário Auth Fix
  test('Santuário Profile Access', async ({ page, loginAs }) => {
    // Login as Space
    await loginAs('space');
    
    // Verify Dashboard
    await expect(page).toHaveURL(/\/space\//, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Hub' }).first()).toBeVisible({ timeout: 15000 });
  });

  // 2. Buscador Daily Blessing Fix
  test('Buscador Daily Blessing Interaction', async ({ page, loginAs, injectMockData }) => {
    await injectMockData();
    await loginAs('client');

    // Check if Blessing Modal appears
    const blessingButton = page.getByRole('button', { name: 'Sintonizar Agora' });
    if (await blessingButton.isVisible()) {
        await blessingButton.click();
        await expect(page.getByText('Sincronizado')).toBeVisible();
    }
    
    // Verify it dismissed
    await expect(page.getByText('Sintonizar Agora')).not.toBeVisible();
    
    // Reload to verify persistence
    await page.reload();
    await expect(page.getByText('Sintonizar Agora')).not.toBeVisible();
  });

  // 3. Guardião Bazar Fix
  test('Guardião Bazar Navigation', async ({ page, loginAs, injectMockData }) => {
    await injectMockData();
    await loginAs('pro'); // Guardião
    // Wait for dashboard to fully load (past the skeleton)
    // Switch to Egrégora tab to find Bazar
    await page.getByText('Egrégora').click({ force: true });
    await page.waitForTimeout(1000);

    // Find and click marketplace card
    await page.getByText('Alquimia').first().click({ force: true });

    // Verify Marketplace View loaded
    await expect(page.getByText('Alquimia')).toBeVisible();
    await expect(page.getByText('Mercado e Bazar')).toBeVisible();
    
    // Verify Add Button exists
    await expect(page.getByText('Novo Produto ou Ritual')).toBeVisible();
  });

});

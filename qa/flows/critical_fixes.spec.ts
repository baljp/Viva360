import { test, expect } from '../utils/mock-fixtures';

test.describe('Critical Fixes Verification', () => {

  // 1. Santuário Auth Fix
  test('Santuário Profile Access', async ({ page, loginAs }) => {
    // Login as Space
    await loginAs('space');
    
    // Verify Dashboard
    await expect(page.getByText('Santuário').first()).toBeVisible({ timeout: 15000 }); 
    await expect(page.getByText('Consagrar Novo Altar')).toBeVisible(); 
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
    // Switch to Expansão tab to find Bazar
    await page.getByText('EXPANSÃO').click({ force: true });
    await page.waitForTimeout(1000);

    // Find and click 'Meu Bazar' card
    await page.getByText('MEU BAZAR').first().click({ force: true });

    // Verify Marketplace View loaded
    await expect(page.getByText('Alquimia Comercial')).toBeVisible();
    await expect(page.getByText('GESTÃO DE BAZAR')).toBeVisible();
    
    // Verify Add Button exists
    await expect(page.getByText('Novo Produto ou Ritual')).toBeVisible();
  });

});

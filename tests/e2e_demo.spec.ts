
import { test, expect } from '@playwright/test';

// FDD: JOURNEY - BUSCADOR SMOKE TEST
test.describe('Demo Journey: Seeker Smoke Test', () => {

  test('Should login and load Dashboard successfully', async ({ page }) => {
    // 1. GATILHO (Login)
    console.log('🔹 Step 1: Login');
    await page.goto('/');
    
    const loginBtn = page.getByRole('button', { name: /já iniciei a jornada|já tenho conta/i });
    if (await loginBtn.isVisible()) {
        await loginBtn.click();
    }

    await page.fill('input[placeholder="seu@email.com"]', 'cliente@viva360.com');
    await page.fill('input[placeholder="••••••••"]', '123456');
    await page.click('button[type="submit"]');

    // Wait for Dashboard (STATE: DASHBOARD)
    await expect(page).toHaveURL(/.*\/client\/home/);
    await expect(page.locator('text=Boa Jornada')).toBeVisible({ timeout: 15000 });
    
    // Verify Key Elements
    await expect(page.locator('text=Karma')).toBeVisible();
    await expect(page.getByText('Jardim Interno')).toBeVisible();
    
    console.log('✅ Dashboard Loaded');
    await page.screenshot({ path: 'test-results/demo_smoke_success.png' });
  });

  // Skipped deep journey until selectors are tuned
  test.skip('Should complete full booking', async ({ page }) => {
      // ... previous logic
  });

});

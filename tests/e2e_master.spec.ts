
import { test, expect } from '@playwright/test';

const ROLES = [
  { name: 'Cliente', email: 'cliente@viva360.com', password: '123456', dashboard: '**/client/home' },
  { name: 'Profissional', email: 'pro@viva360.com', password: '123456', dashboard: '**/pro/home' },
  { name: 'Espaço', email: 'space@viva360.com', password: '123456', dashboard: '**/space/home' },
  { name: 'Admin', email: 'admin@viva360.com', password: '123456', dashboard: '**/admin/dashboard' }
];

test.describe('Master Enterprise E2E Suite', () => {

  for (const role of ROLES) {
    test(`Role Discovery & Asset Audit - ${role.name}`, async ({ page }) => {
      // 1. Authentication
      await page.goto('/');
      
      const loginBtn = page.getByRole('button', { name: /já tenho conta/i });
      if (await loginBtn.isVisible()) {
        await loginBtn.click();
      }

      await page.fill('input[placeholder="seu@email.com"]', role.email);
      await page.fill('input[placeholder="••••••••"]', role.password);
      await page.click('button[type="submit"]');

      // 2. Dashboard Validation
      await page.waitForURL(role.dashboard, { timeout: 15000 });
      await expect(page).not.toHaveTitle(/error/i);

      // 3. Scan for Broken Assets and Recursive Discovery
      const visited = new Set<string>();
      const toVisit = [page.url()];

      let count = 0;
      while (toVisit.length > 0 && count < 8) {
        const url = toVisit.pop()!;
        if (visited.has(url)) continue;
        visited.add(url);
        count++;

        console.log(`Auditing [${role.name}]: ${url}`);
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Capture Screenshot for Visual Baseline
        await page.screenshot({ 
            path: `test-results/snapshots/${role.name}_page_${count}.png`, 
            fullPage: true 
        });

        // Audit: Broken Images
        const brokenImages: string[] = [];
        const images = await page.locator('img').all();
        for (const img of images) {
          const src = await img.getAttribute('src');
          if (src) {
             const response = await page.request.get(src).catch(() => null);
             if (response && response.status() >= 400) {
                brokenImages.push(src);
             }
          }
        }
        if (brokenImages.length > 0) {
           console.error(`❌ Broken Images found on ${url}:`, brokenImages);
        }

        // Discovery: Internal Links
        const links = await page.locator('a').all();
        for (const link of links) {
          const href = await link.getAttribute('href');
          if (href && href.startsWith('/') && !visited.has(new URL(href, page.url()).href)) {
             toVisit.push(new URL(href, page.url()).href);
          }
        }
      }
    });
  }

  test('Cross-Profile Workflow: Booking Integration', async ({ page, context }) => {
    // 1. CLIENT: Initiate a booking or interest
    await page.goto('/');
    await page.getByRole('button', { name: /já tenho conta/i }).click();
    await page.fill('input[placeholder="seu@email.com"]', 'cliente@viva360.com');
    await page.fill('input[placeholder="••••••••"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/client/home');

    // Visit Marketplace or Discovery to trigger an action
    await page.goto('/client/marketplace');
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: 'test-results/integration/client_view.png' });

    // 2. PRO: Verify Dashboard Visibility
    const proPage = await context.newPage();
    await proPage.goto('/');
    await proPage.getByRole('button', { name: /já tenho conta/i }).click();
    await proPage.fill('input[placeholder="seu@email.com"]', 'pro@viva360.com');
    await proPage.fill('input[placeholder="••••••••"]', '123456');
    await proPage.click('button[type="submit"]');
    await proPage.waitForURL('**/pro/home');
    
    // Check for dashboard elements
    await expect(proPage.locator('text=/agenda|dashboard/i').first()).toBeVisible();
    await proPage.screenshot({ path: 'test-results/integration/pro_dashboard.png' });
  });
});

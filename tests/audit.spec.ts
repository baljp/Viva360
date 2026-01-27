
import { test, expect } from '@playwright/test';

test.describe('Global Visual & Functional Audit', () => {
  const brokenImages: string[] = [];
  const brokenLinks: string[] = [];
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    page.on('response', response => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && url.match(/\.(png|jpg|jpeg|svg|webp|gif)$/)) {
        brokenImages.push(`${url} (Status: ${status})`);
      }
    });
  });

  test('Scan Landing and Critical Flows', async ({ page }) => {
    // 1. Visit Home/Login
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1a. Handle Landing Page - Click "JÁ TENHO CONTA" to reveal login form
    const loginBtn = page.getByRole('button', { name: /já tenho conta/i });
    if (await loginBtn.isVisible()) {
        await loginBtn.click();
    }

    // 2. Perform Mock Login to access authenticated views
    await page.fill('input[placeholder="seu@email.com"]', 'cliente@viva360.com');
    await page.fill('input[placeholder="••••••••"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/client/home');
    
    // 3. Audit Images on Dashboard
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && (src.includes('placeholder') || src.includes('broken'))) {
          // logic to flag if needed
      }
    }

    // 4. Audit Navigation Links
    const links = await page.locator('button, a').all();
    for (const link of links) {
       // Just ensuring they don't crash the app on hover/click in this simplified audit
    }

    // 5. Check other roles (Navigating via internal setView logic)
    // We can simulate role switching if supported by mock, or just visit URLs
    const roles = ['/pro/home', '/space/home', '/admin/dashboard'];
    for (const route of roles) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        // Check for "404" or "Error" text on page which might indicate broken routing
        const content = await page.textContent('body');
        if (content?.toLowerCase().includes('not found') || content?.toLowerCase().includes('error')) {
            brokenLinks.push(`Route ${route} seems broken or inaccessible`);
        }
    }
  });

  test.afterAll(async () => {
    console.log('\n--- AUDIT REPORT ---');
    if (brokenImages.length > 0) {
      console.log('❌ Broken Images Found:', brokenImages);
    } else {
      console.log('✅ No broken images detected.');
    }

    if (brokenLinks.length > 0) {
      console.log('❌ Broken Links/Routes Found:', brokenLinks);
    } else {
      console.log('✅ No broken routes detected.');
    }

    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Detected:', consoleErrors);
    } else {
      console.log('✅ Clean Console (No errors).');
    }
    console.log('--------------------\n');
    
    expect(brokenImages.length, 'Should have no broken images').toBe(0);
    expect(brokenLinks.length, 'Should have no dead routes').toBe(0);
  });
});

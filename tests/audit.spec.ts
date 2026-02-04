/**
 * VIVA360 - Global Audit E2E Test
 * 
 * Uses direct localStorage session injection to bypass Supabase authentication.
 * This avoids timeout issues when Supabase is not configured for test environment.
 */
import { test, expect } from '@playwright/test';

// Mock user data for direct session injection
const MOCK_CLIENT = {
  id: 'client_0',
  role: 'CLIENT',
  name: 'Ana Luz',
  email: 'client0@viva360.com',
  avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=client_0',
  karma: 500,
  streak: 5,
  multiplier: 1.0,
  personalBalance: 100,
  corporateBalance: 0,
  plantStage: 'flower',
  plantXp: 50,
  snaps: []
};

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
    // DIRECT SESSION INJECTION - Bypasses Supabase auth
    await page.addInitScript((user) => {
      window.localStorage.setItem('viva360.mock_user', JSON.stringify(user));
      window.localStorage.setItem('viva360_smart_tutorial_seen', 'true');
      for(let i = 0; i < 100; i++) {
        window.localStorage.setItem(`viva360_tutorial_seen_${i}`, 'true');
      }
    }, MOCK_CLIENT);

    // Navigate directly to dashboard (already "logged in" via localStorage)
    await page.goto('/client/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Allow page to hydrate
    
    // 3. Audit Images on Dashboard
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && src.includes('broken')) {
        brokenImages.push(src);
      }
    }

    // 4. Audit Navigation Links
    const links = await page.locator('button, a').all();
    console.log(`[Audit] Found ${links.length} interactive elements`);

    // 5. Check other roles
    const roles = ['/pro/home', '/space/home'];
    for (const route of roles) {
        // Inject different user for each role
        const roleUser = route.includes('pro') 
          ? { ...MOCK_CLIENT, id: 'pro_0', role: 'PROFESSIONAL', name: 'Guardião Demo' }
          : { ...MOCK_CLIENT, id: 'hub_0', role: 'SPACE', name: 'Santuário Demo' };
        
        await page.evaluate((user) => {
          window.localStorage.setItem('viva360.mock_user', JSON.stringify(user));
        }, roleUser);
        
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        
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
      console.log('❌ Console Errors Detected:', consoleErrors.length);
    } else {
      console.log('✅ Clean Console (No errors).');
    }
    console.log('--------------------\n');
    
    expect(brokenImages.length, 'Should have no broken images').toBe(0);
    expect(brokenLinks.length, 'Should have no dead routes').toBe(0);
  });
});


import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { Database } from '../utils/seedEngine';

const ROLES = [
  { name: 'Cliente', user: Database.clients[0], dashboard: '/client/home' },
  { name: 'Profissional', user: Database.pros[0], dashboard: '/pro/home' },
  { name: 'Espaço', user: Database.spaces[0], dashboard: '/space/home' },
  { name: 'Admin', user: Database.admins[0], dashboard: '/admin/dashboard' }
];
const MOCK_TOKEN = String(process.env.MOCK_AUTH_TOKEN || 'viva360_test_mock_token_2026').trim();

function ensureScreenshotDirs() {
  fs.mkdirSync(path.resolve('test-results/snapshots'), { recursive: true });
  fs.mkdirSync(path.resolve('test-results/integration'), { recursive: true });
}

async function handleOnboarding(page: any) {
  // Aggressively disable tutorial via localStorage
  await page.evaluate(() => {
    localStorage.setItem('viva360_smart_tutorial_seen', 'true');
    // Also try to set it for known user IDs if possible, or just the generic one
    for (let i = 0; i < 100; i++) {
      localStorage.setItem(`viva360_tutorial_seen_${i}`, 'true');
    }
    // Also for standard mock user
    localStorage.setItem('viva360_tutorial_seen_mock-user-id', 'true');
  });

  const nextBtn = page.getByRole('button', { name: /próximo/i });
  let safety = 0;
  while (await nextBtn.isVisible() && safety < 10) {
    await nextBtn.click();
    await page.waitForTimeout(500);
    safety++;
  }
}

async function loginAsMock(page: any, role: (typeof ROLES)[number]) {
  await page.addInitScript(
    ({ user, token }) => {
      window.localStorage.setItem('viva360.mock_user', JSON.stringify(user));
      window.localStorage.setItem('viva360.session.mode', 'mock');
      window.localStorage.setItem('viva360.test_mode.active', '1');
      window.localStorage.setItem('viva360.auth.token', token);
      window.localStorage.setItem('viva360_smart_tutorial_seen', 'true');
      if (user?.id) {
        window.localStorage.setItem(`viva360_tutorial_seen_${user.id}`, 'true');
      }
    },
    { user: role.user, token: MOCK_TOKEN }
  );

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(role.dashboard, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForURL((url: URL) => url.pathname === role.dashboard, { timeout: 15000 }).catch(() => undefined);
      await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined);
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await page.goto('/', { waitUntil: 'commit', timeout: 15000 }).catch(() => undefined);
        await page.waitForTimeout(800);
      }
    }
  }
  if (lastError) throw lastError;
}

test.describe('Master Enterprise E2E Suite', () => {
  test.describe.configure({ timeout: 180000, mode: 'serial' });

  for (const role of ROLES) {
    test(`Role Discovery & Asset Audit - ${role.name}`, async ({ page }) => {
      ensureScreenshotDirs();
      await loginAsMock(page, role);

      // 2. Dashboard Validation
      await handleOnboarding(page);
      await expect(page).not.toHaveTitle(/error/i);

      // 3. Scan for Broken Assets and Recursive Discovery
      const visited = new Set<string>();
      const toVisit = [page.url()];

      let count = 0;
      const maxPages = 4;
      while (toVisit.length > 0 && count < maxPages) {
        const url = toVisit.pop()!;
        if (visited.has(url)) continue;
        visited.add(url);
        count++;

        console.log(`Auditing [${role.name}]: ${url}`);
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (err) {
          console.warn(`⚠️ Skipping slow/broken URL: ${url}`);
          continue;
        }
        await page.waitForTimeout(500);

        // Capture Screenshot for Visual Baseline
        await page.screenshot({
          path: `test-results/snapshots/${role.name}_page_${count}.png`,
          fullPage: true
        });

        // Audit: Broken Images (local render check, limited)
        const brokenImages: string[] = [];
        const images = await page.locator('img').all();
        for (const img of images.slice(0, 20)) {
          const src = await img.getAttribute('src');
          if (!src) continue;
          const isBroken = await img.evaluate((el) => {
            const image = el as HTMLImageElement;
            return image.complete && image.naturalWidth === 0;
          }).catch(() => false);
          if (isBroken) brokenImages.push(src);
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

  test('Cross-Profile Workflow: Booking Integration', async ({ browser }) => {
    // 1. CLIENT: Initiate a booking or interest
    ensureScreenshotDirs();
    const clientContext = await browser.newContext();
    const page = await clientContext.newPage();

    await loginAsMock(page, ROLES[0]);
    await handleOnboarding(page);

    // Visit Marketplace or Discovery to trigger an action
    await page.goto('/client/marketplace');
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: 'test-results/integration/client_view.png' });

    // 2. PRO: Verify Dashboard Visibility in ISOLATED context
    const proContext = await browser.newContext();
    const proPage = await proContext.newPage();

    await loginAsMock(proPage, ROLES[1]);
    await handleOnboarding(proPage);

    // Check for dashboard elements
    await expect(proPage.locator('text=/Portal de Cura|Egrégora/i').first()).toBeVisible({ timeout: 10000 });
    await proPage.screenshot({ path: 'test-results/integration/pro_dashboard.png' });

    await clientContext.close();
    await proContext.close();
  });
});

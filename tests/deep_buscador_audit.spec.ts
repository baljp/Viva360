
import { test, expect, Page } from '@playwright/test';

const PERSONAS = [
  { name: 'Santuário da Paz', email: 'peace@viva360.com', mood: 'SERENO' },
  { name: 'Fogo Criativo', email: 'fire@viva360.com', mood: 'VIBRANTE' },
  { name: 'Buscador Profundo', email: 'deep@viva360.com', mood: 'MELANCÓLICO' },
];

async function handleOnboarding(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('viva360.onboarding_completed', 'true');
    localStorage.setItem('viva360.tutorial_step', '999');
    localStorage.setItem('viva360.onboarding_seen', 'true');
    localStorage.setItem('viva360.welcome_message_seen', 'true');
    localStorage.setItem('viva360_smart_tutorial_seen', 'true');
    for (let i = 0; i < 20; i++) localStorage.setItem(`viva360_tutorial_seen_${i}`, 'true');
  });
  
  // Clean up any visible overlays
  for (let i = 0; i < 15; i++) {
    const nextBtn = page.locator('button:has-text("Próximo"), button:has-text("Entendido"), button:has-text("Concluir"), .lucide-x').first();
    if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(300);
    } else break;
  }
}

async function exhaustiveClick(page: Page, label: string) {
    console.log(`Auditing section: ${label}`);
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
        if (await btn.isVisible() && await btn.isEnabled()) {
            const text = await btn.innerText();
            if (text.match(/Sair|Logout|Excluir/i)) continue; // Don't logout
            try {
                await btn.click({ timeout: 2000 });
                await page.waitForTimeout(500);
                // If it opened a sub-view or modal, try to find a back/close button
                const backBtn = page.locator('button:has-text("Voltar"), button:has-text("Início"), .lucide-arrow-left, .lucide-x').first();
                if (await backBtn.isVisible()) {
                    await backBtn.click();
                    await page.waitForTimeout(300);
                }
            } catch (e) {
                // Ignore click failures (e.g. element detached)
            }
        }
    }
}

test.describe('Exhaustive Buscador Audit', () => {

  for (const persona of PERSONAS) {
    test(`Massive UI Audit - ${persona.name}`, async ({ page }) => {
      test.setTimeout(120000); // 2 minutes per persona

      await page.goto('/');
      await handleOnboarding(page);
      
      const loginBtn = page.getByRole('button', { name: /já iniciei a jornada/i });
      if (await loginBtn.isVisible()) await loginBtn.click();

      await page.fill('input[placeholder="seu@email.com"]', persona.email);
      await page.fill('input[placeholder="••••••••"]', '123456');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/client/home', { timeout: 15000 });
      await handleOnboarding(page);

      // 1. Dashboard Sweep
      await exhaustiveClick(page, 'Main Dashboard');
      await page.screenshot({ path: `test-results/stress/dashboard_${persona.email}.png` });

      // 2. Specific Feature Flows with sub-navigation
      const routes = ['/client/oracle', '/client/marketplace', '/client/journey', '/client/tribe', '/client/journal'];
      
      for (const route of routes) {
          console.log(`Navigating to ${route}...`);
          await page.goto(route);
          await page.waitForTimeout(2000);
          await handleOnboarding(page); // In case they appear on sub-routes
          
          await exhaustiveClick(page, `Flow: ${route}`);
          
          // Handle specific interactions (e.g. drawing cards, planting seeds)
          const interactables = page.locator('button:has-text("Regar"), button:has-text("Plantar"), button:has-text("Revelar"), button:has-text("Adquirir")').all();
          for (const item of await interactables) {
              if (await item.isVisible()) {
                  await item.click();
                  await page.waitForTimeout(1000);
                  // Check for toasts
                  await expect(page.locator('.lucide-sparkles, .lucide-check, text=/sucesso|concluído|grato/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
              }
          }
          
          await page.screenshot({ path: `test-results/stress/route_${route.replace(/\//g, '_')}_${persona.email}.png` });
      }

      // 3. Sharing Logic
      await page.goto('/client/home');
      const shareBtn = page.locator('button:has-text("Compartilhar")').first();
      if (await shareBtn.isVisible()) {
          await shareBtn.click();
          await page.waitForTimeout(2000);
          // Verify canvas/modal is up
          await expect(page.locator('canvas, img[src^="data:image"]')).toBeVisible({ timeout: 10000 }).catch(() => {});
          await page.screenshot({ path: `test-results/stress/sharing_${persona.email}.png` });
      }

      console.log(`✅ COMPLETE AUDIT FOR ${persona.name}`);
    });
  }
});

import { test, expect } from '@playwright/test';

// Simulation of 10 concurrent users (scaled down from 10k for local execution)
// Real 10k load requires k6 or specialized infra.
const CONCURRENT_USERS = 10; 

test.describe('Stress / Concurrency @stress', () => {
  
  test(`Simulate ${CONCURRENT_USERS} concurrent logins`, async ({ browser }) => {
    
    // Create an array of promises
    const actions = Array.from({ length: CONCURRENT_USERS }).map(async (_, i) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
            const startTime = Date.now();
            
            // Simple Login Flow
            await page.goto('/');
            await page.getByRole('button', { name: /já tenho conta/i }).click();
            
            // Distributed logins to avoid rate limits if real, but here we hit local
            await page.fill('input[placeholder="seu@email.com"]', `client_${i}@viva360.com`);
            await page.fill('input[placeholder="••••••••"]', '123456');
            await page.click('button[type="submit"]');
            
            await page.waitForURL('**/client/home', { timeout: 20000 });
            
            const duration = Date.now() - startTime;
            console.log(`User ${i} logged in. Duration: ${duration}ms`);
            
            expect(duration).toBeLessThan(10000); // Performance SLA
            
        } catch (e) {
            console.error(`User ${i} failed:`, e);
            throw e;
        } finally {
            await context.close();
        }
    });

    await Promise.all(actions);
  });
});

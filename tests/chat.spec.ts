import { test, expect } from '@playwright/test';

test.describe('Chat Real Identification Logic', () => {

    test('ProChatListScreen mapping displays authentic counterparty', async ({ page, browser }) => {
        // We will authenticate as a professional and verify the Chat list
        await page.goto('/');

        // Disable tutorials via localStorage
        await page.evaluate(() => {
            localStorage.setItem('viva360_smart_tutorial_seen', 'true');
            for (let i = 0; i < 10; i++) {
                localStorage.setItem(`viva360_tutorial_seen_${i}`, 'true');
            }
        });

        // 1. Initial Login
        const loginBtn = page.getByRole('button', { name: /já iniciei a jornada/i });
        await expect(loginBtn).toBeVisible({ timeout: 10000 });
        await loginBtn.click();

        await page.fill('input[placeholder="seu@email.com"]', 'pro@viva360.com');
        await page.fill('input[placeholder="••••••••"]', '123456');
        await page.click('button[type="submit"]');

        await page.waitForURL('**/pro/home', { timeout: 15000 });

        // 2. Navigate to Chat List
        // Go towards communication module
        await page.goto('/pro/chat');
        await page.waitForTimeout(1000);

        // Given our mock logic creates rooms based on real useCases, 
        // We evaluate if "Maria Silva" or "João Souza" appear without crashing.
        // It should properly filter out the 'me' placeholder crash if logic is pure.

        const chatTitle = page.locator('text=/COMUNICAÇÃO SAGRADA/i');
        await expect(chatTitle).toBeVisible({ timeout: 10000 });

        // Ensure real profiles are shown representing counterparties.
        const patientName = page.locator('text=/Maria Silva/i');
        await expect(patientName.first()).toBeVisible();

        // 3. Take a snapshot
        await page.screenshot({ path: 'test-results/chat-list-identification.png' });
    });
});

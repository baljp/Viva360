
import { test, expect } from '../utils/mock-fixtures';

test.describe('Guardião Flow Debug', () => {
    test.beforeEach(async ({ loginAs }) => {
        await loginAs('pro');
    });

    test('@debug should dump html after Agenda click', async ({ page }) => {
        console.log('--- DEBUG: Initial Page Content ---');
        // console.log(await page.content()); 

        // 1. Agenda Portal
        console.log('--- DEBUG: Clicking Agenda ---');
        await page.getByText('Agenda').first().click();
        
        await page.waitForTimeout(2000); // Wait for transition
        console.log('--- DEBUG: Post-Click Content ---');
        const content = await page.content();
        console.log(content);
        
        // Assert to fail so we see output? Or just let it pass.
    });
});

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';
const DIR = '/tmp/mobile-audit';
mkdirSync(DIR, { recursive: true });

const VIEWPORT = { width: 375, height: 812 }; // iPhone SE/13 mini

async function run() {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
    const page = await ctx.newPage();

    const screenshot = async (name: string) => {
        await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
        console.log(`📸 ${name}`);
    };

    // 1. AUTH - Landing
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    await screenshot('01-auth-landing');

    // 2. AUTH - Open login bottom sheet
    const loginBtn = page.locator('button:has-text("Entrar"), button:has-text("entrar")').first();
    if (await loginBtn.isVisible()) {
        await loginBtn.click();
        await page.waitForTimeout(800);
        await screenshot('02-auth-login-sheet');

        // Scroll down to see full form
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(500);
        await screenshot('03-auth-login-scrolled');
    }

    // 3. Try to navigate to registration
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await screenshot('04-registration');

    // 4. Try reset password
    await page.goto(`${BASE}/reset-password`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await screenshot('05-reset-password');

    // 5. Try direct view routes (will redirect to login but shows route handling)
    for (const route of ['/client/home', '/pro/home', '/space/home', '/settings']) {
        await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(800);
        await screenshot(`06-route-${route.replace(/\//g, '-').slice(1)}`);
    }

    // 6. Check for overflow issues programmatically
    console.log('\n🔍 Checking for horizontal overflow...');
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const overflowCheck = await page.evaluate(() => {
        const issues: string[] = [];
        document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > 375 && rect.width > 0 && getComputedStyle(el).overflow !== 'hidden' && getComputedStyle(el).overflowX !== 'hidden' && getComputedStyle(el).overflowX !== 'auto') {
                const cls = el.className?.toString().slice(0, 80) || el.tagName;
                if (!issues.some(i => i.includes(cls))) {
                    issues.push(`[${el.tagName}] right=${Math.round(rect.right)}px class="${cls}"`);
                }
            }
        });
        return issues.slice(0, 20);
    });

    if (overflowCheck.length > 0) {
        console.log('❌ HORIZONTAL OVERFLOW DETECTED:');
        overflowCheck.forEach(i => console.log(`  ${i}`));
    } else {
        console.log('✅ No horizontal overflow on auth page');
    }

    // Open login and check
    const loginBtn2 = page.locator('button:has-text("Entrar"), button:has-text("entrar")').first();
    if (await loginBtn2.isVisible()) {
        await loginBtn2.click();
        await page.waitForTimeout(800);
        
        const loginOverflow = await page.evaluate(() => {
            const issues: string[] = [];
            document.querySelectorAll('*').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.right > 375 && rect.width > 0 && el.offsetParent !== null) {
                    const cls = el.className?.toString().slice(0, 80) || el.tagName;
                    if (!issues.some(i => i.includes(cls))) {
                        issues.push(`[${el.tagName}] right=${Math.round(rect.right)}px w=${Math.round(rect.width)}px class="${cls}"`);
                    }
                }
            });
            return issues.slice(0, 20);
        });

        if (loginOverflow.length > 0) {
            console.log('❌ LOGIN FORM OVERFLOW:');
            loginOverflow.forEach(i => console.log(`  ${i}`));
        } else {
            console.log('✅ No overflow on login form');
        }
    }

    await browser.close();
    console.log(`\n📁 Screenshots saved to ${DIR}/`);
}

run().catch(console.error);

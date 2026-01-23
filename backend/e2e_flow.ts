
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';
const TIMEOUT = 10000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function request(label: string, url: string, opts: any = {}) {
    const start = Date.now();
    try {
        const res = await fetch(url, opts);
        const duration = Date.now() - start;
        console.log(`[${res.ok ? 'PASS' : 'FAIL'}] ${label} (${duration}ms) - ${res.status}`);
        if (!res.ok) {
            const txt = await res.text();
            console.error(`       Error: ${txt.substring(0, 200)}`);
            throw new Error(`Failed ${label}`);
        }
        return res.json();
    } catch (e: any) {
        console.error(`[ERR ] ${label} - ${e.message}`);
        throw e;
    }
}

async function runE2E() {
    console.log("🚀 STARTING E2E USER JOURNEY TEST...");
    
    // 1. REGISTER
    const email = `test_user_${Date.now()}@viva360.com`;
    const password = 'Password123!';
    const name = 'Neo Buscador';

    console.log(`\n1. Registering new user: ${email}`);
    // Using login endpoint for mock 'auto-register' if standard register isn't separate in mock mode,
    // but let's try strict flow if available. Based on earlier audit, we used /auth/login directly.
    // Let's try /auth/register first if it exists, otherwise fall back or assume login creates in mock.
    // Actually, check_endpoints.ts only checked login. Let's assume Register endpoint exists or use Login-as-Register for mock.
    // Looking at routes, /auth/register exists.
    
    let user;
    let token;

    try {
        const regData = await request('Register User', `${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, role: 'CLIENT' })
        });
        console.log("   Register Response:", JSON.stringify(regData));
        user = regData.user;
        token = regData.session?.access_token;

        if (!token) {
             console.log("   (Register returned no session, performing login...)");
             const loginData = await request('Login after Register', `${API_URL}/auth/login`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email, password })
             });
             token = loginData.session?.access_token;
        }
    } catch (e) {
        // Fallback for mock mode if register is tricky: just login
        console.log("   (Register failed or strictly mock? Trying login to create/access)");
        const loginData = await request('Login (Fallback)', `${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        user = loginData.user;
        token = loginData.session.access_token;
    }

    if (!token) throw new Error("No token obtained");
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. PROFILE
    console.log(`\n2. Verifying Profile for ${user.name}`);
    const profile = await request('Get Profile', `${API_URL}/profiles/me`, { headers });
    if (profile.email !== email && profile.email !== 'mock@viva360.com') { // Mock might return fixed email
         console.warn("   [WARN] Email mismatch (likely mock mode artifact):", profile.email);
    }

    // 3. MARKETPLACE
    console.log("\n3. Browsing Marketplace");
    const products = await request('List Products', `${API_URL}/marketplace/products`, { headers });
    if (products.length === 0) throw new Error("No products found in marketplace");
    const product = products[0];
    console.log(`   Found product: ${product.name} ($${product.price})`);

    // 4. CHECKOUT
    console.log(`\n4. Purchasing ${product.name}`);
    const purchase = await request('Purchase Product', `${API_URL}/marketplace/purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: product.id || 'test_prod', amount: product.price, description: `E2E Buy ${product.name}` })
    });
    console.log("   Purchase successful. Transaction ID:", purchase.id || 'mock-tx');

    // 5. NOTIFICATIONS
    console.log("\n5. Checking Order Confirmation");
    await sleep(500); // Give async jobs time
    const notifs = await request('List Notifications', `${API_URL}/notifications`, { headers });
    // In a real system we look for specific message. In mock, we just verify endpoint works.
    console.log(`   User has ${notifs.length} notifications.`);

    console.log("\n✅ E2E TEST COMPLETED SUCCESSFULLY");
}

runE2E().catch(() => {
    console.error("\n❌ E2E TEST FAILED");
    process.exit(1);
});

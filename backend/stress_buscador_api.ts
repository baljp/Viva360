
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';
const NUM_USERS = 1000;
const CONCURRENCY = 20; // Simultaneous batches

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function request(label: string, url: string, opts: any = {}) {
    try {
        const res = await fetch(url, {
            ...opts,
            timeout: 30000
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`[${res.status}] ${label}: ${txt.substring(0, 100)}`);
        }
        return res.json();
    } catch (e: any) {
        throw new Error(`[ERR] ${label}: ${e.message}`);
    }
}

async function simulateUser(id: number) {
    const email = `stress_buscador_${id}_${Date.now()}@viva360.com`;
    const password = 'Password123!';
    const name = `Buscador ${id}`;
    
    try {
        // 1. REGISTER
        const regData = await request(`User ${id} Register`, `${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, role: 'CLIENT' })
        });
        
        const token = regData.session?.access_token || (await request(`User ${id} Login`, `${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })).session?.access_token;

        if (!token) throw new Error("Token missing");
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. ORACLE DRAW
        await request(`User ${id} Oracle`, `${API_URL}/profiles/me`, { headers }); // Simulate profile check
        
        // 3. JOURNAL ENTRY
        await request(`User ${id} Journal`, `${API_URL}/profiles/me`, { 
            method: 'PATCH',
            headers,
            body: JSON.stringify({ bio: `Soul journey of user ${id}`, intention: 'Clarity and Peace' })
        });

        // 4. MARKETPLACE
        const products = await request(`User ${id} Browse`, `${API_URL}/marketplace/products`, { headers });
        if (products.length > 0) {
            const p = products[Math.floor(Math.random() * products.length)];
            await request(`User ${id} Buy`, `${API_URL}/marketplace/purchase`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ product_id: p.id, amount: p.price, description: `Stress purchase by ${name}` })
            });
        }

        // 5. NOTIFICATIONS
        await request(`User ${id} Notifs`, `${API_URL}/notifications`, { headers });

        return true;
    } catch (e: any) {
        console.error(`❌ User ${id} Failed: ${e.message}`);
        return false;
    }
}

async function runStress() {
    console.log(`🚀 STARTING MASSIVE STRESS TEST: ${NUM_USERS} USERS...`);
    const start = Date.now();
    let successCount = 0;

    for (let i = 0; i < NUM_USERS; i += CONCURRENCY) {
        const batch = [];
        for (let j = 0; j < CONCURRENCY && (i + j) < NUM_USERS; j++) {
            batch.push(simulateUser(i + j));
        }
        
        const results = await Promise.all(batch);
        successCount += results.filter(r => r).length;
        
        if (i % 100 === 0 && i > 0) {
            console.log(`   Progress: ${i}/${NUM_USERS} users processed...`);
        }
    }

    const duration = Date.now() - start;
    console.log(`\n🏆 STRESS TEST COMPLETE`);
    console.log(`   Total Users: ${NUM_USERS}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Avg: ${Math.round(duration / NUM_USERS)}ms/user`);

    if (successCount < NUM_USERS * 0.95) {
        process.exit(1);
    }
}

runStress().catch(e => {
    console.error("FATAL STRESS ERROR:", e);
    process.exit(1);
});

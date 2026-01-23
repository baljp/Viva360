
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

async function check(name: string, p: Promise<any>) {
    try {
        const res = await p;
        if(res.ok) console.log(`[PASS] ${name} (${res.status})`);
        else {
            const txt = await res.text();
            console.error(`[FAIL] ${name} (${res.status}) - ${txt.substring(0, 100)}`);
        }
        return res;
    } catch (e: any) {
        console.error(`[ERR ] ${name} - ${e.message}`);
    }
}

async function run() {
    console.log("=== CHECKING ENDPOINTS ===");

    // 1. Ping
    await check('GET /ping', fetch(`${API_URL}/ping`));

    // 2. Auth Login
    console.log("\n--- AUTH ---");
    const loginRes = await check('POST /auth/login', fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'client0@viva360.com', password: '123' }) // Intentionally using wrong password first? No, use correct one.
    }));

    // Retry with correct password if 123 fails (it failed in previous step, let's use 123456)
    let token = '';
    
    if (loginRes && !loginRes.ok) {
         const loginRes2 = await check('POST /auth/login (Correct Password)', fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'client0@viva360.com', password: '123456' }) 
        }));
        if(loginRes2 && loginRes2.ok) {
            const data = await loginRes2.json();
            token = data.session.access_token;
        }
    } else if (loginRes && loginRes.ok) {
        const data = await loginRes.json();
        token = data.session.access_token;
    }

    if (!token) {
        console.error("!!! CRITICAL: Cannot proceed without token. Login failed.");
        return;
    }

    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 3. Profiles
    console.log("\n--- PROFILES ---");
    await check('GET /profiles/me', fetch(`${API_URL}/profiles/me`, { headers }));
    await check('PATCH /profiles/me', fetch(`${API_URL}/profiles/me`, { 
        method: 'PATCH',
        headers,
        body: JSON.stringify({ bio: 'Checked by Automated Script' })
    }));

    // 4. Appointments
    console.log("\n--- APPOINTMENTS ---");
    await check('GET /appointments', fetch(`${API_URL}/appointments`, { headers }));
    // Mock Create
    await check('POST /appointments', fetch(`${API_URL}/appointments`, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ 
            professional_id: 'mock-pro-id', 
            // clientId: 'mock-me', // Not needed, inferred from token
            time: '09:00', 
            date: new Date().toISOString(),
            service_name: 'Test Session',
            price: 100
        })
    }));

    // 5. Marketplace
    console.log("\n--- MARKETPLACE ---");
    await check('GET /marketplace/products', fetch(`${API_URL}/marketplace/products`, { headers }));
    await check('POST /marketplace/purchase', fetch(`${API_URL}/marketplace/purchase`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: 'test_prod', amount: 50, description: 'Test Purchase' })
    }));

    // 6. Notifications
    console.log("\n--- NOTIFICATIONS ---");
    await check('GET /notifications', fetch(`${API_URL}/notifications`, { headers }));
    // Try to mark read a mock id
    await check('PATCH /notifications/mock-id/read', fetch(`${API_URL}/notifications/mock-id/read`, { method: 'PATCH', headers }));

    console.log("\n=== CHECK COMPLETE ===");
}

run();

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function check(name: string, p: Promise<any>) {
    try {
        const res = await p;
        // axios throws on non-2xx by default, so if we are here it's likely pass, unless we config otherwise.
        // But for endpoints that return 4xx (like login failure test), we need to catch.
        // Assuming we want to print success:
        console.log(`✅ [PASS] ${name} (${res.status})`);
        return { ok: true, status: res.status, json: () => res.data };
    } catch (e: any) {
        if (e.response) {
            console.error(`❌ [FAIL] ${name} (${e.response.status}) - ${JSON.stringify(e.response.data).substring(0, 100)}`);
            return { ok: false, status: e.response.status };
        }
        console.error(`💥 [ERR ] ${name} - ${e.message}`);
    }
}

async function run() {
    console.log("=== CHECKING ALL ENDPOINTS (PHASE 1-3) ===");

    // 1. Health/Ping
    await check('GET /ping', axios.get(`${API_URL}/ping`));

    // 2. Auth Login
    console.log("\n--- AUTH SERVICE ---");
    let token = '';
    const loginRes = await check('POST /auth/login', axios.post(`${API_URL}/auth/login`, {
        email: 'client0@viva360.com', password: '123'
    }));

    if (loginRes && loginRes.ok) {
        token = loginRes.json ? loginRes.json().session?.access_token : ''; 
    } else {
        const loginRes2 = await check('POST /auth/login (Fallback)', axios.post(`${API_URL}/auth/login`, {
            email: 'client0@viva360.com', password: '123456'
        }));
        if(loginRes2 && loginRes2.ok) {
            token = loginRes2.json ? loginRes2.json().session?.access_token : '';
        }
    }

    if (!token) {
        console.error("!!! CRITICAL: Cannot proceed without token. Login failed.");
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    // 3. Oracle
    console.log("\n--- ORACLE SERVICE ---");
    await check('POST /oracle/draw', axios.post(`${API_URL}/oracle/draw`, { mood: 'Ansioso' }, { headers }));
    await check('GET /oracle/history', axios.get(`${API_URL}/oracle/history`, { headers }));

    // 4. Metamorphosis
    console.log("\n--- RITUAL SERVICE (Metamorphosis) ---");
    await check('POST /metamorphosis/checkin', axios.post(`${API_URL}/metamorphosis/checkin`, { 
        mood: 'Motivado', 
        photoHash: 'test-hash-123', 
        photoThumb: 'thumb-legacy'
    }, { headers }));
    
    await new Promise(r => setTimeout(r, 1000));
    await check('GET /metamorphosis/evolution', axios.get(`${API_URL}/metamorphosis/evolution`, { headers }));

    // 5. Marketplace
    console.log("\n--- MARKETPLACE SERVICE ---");
    await check('GET /marketplace/products', axios.get(`${API_URL}/marketplace/products`, { headers }));
    
    // 6. Notifications
    console.log("\n--- NOTIFICATION SERVICE ---");
    await check('GET /notifications', axios.get(`${API_URL}/notifications`, { headers }));

    console.log("\n=== COMPLETED ===");
}

run();

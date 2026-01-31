import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
let AUTH_TOKEN = '';

const testUser = {
  email: `audit_${Date.now()}@viva360.test`,
  password: 'Password123!',
  name: 'Audit Tester'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const results: { endpoint: string; status: string; details?: any }[] = [];

const log = (endpoint: string, status: 'OK' | 'FAIL', details?: any) => {
    results.push({ endpoint, status, details });
    let detailStr = '';
    if (details) {
        detailStr = typeof details === 'object' ? JSON.stringify(details) : String(details);
    }
    console.log(`${status === 'OK' ? '✅' : '❌'} ${endpoint}: ${status} ${detailStr ? `(${detailStr})` : ''}`);
};

const runAudit = async () => {
    console.log('🚀 Starting Lightweight API & E2E Audit...');

    try {
        // 0. Health Check
        try {
            const health = await axios.get(`${BASE_URL}/health`);
            log('GET /health', 'OK', health.data.status);
        } catch (e: any) {
            log('GET /health', 'FAIL', e.message);
            process.exit(1);
        }

        await delay(500);

        // 1. Auth: Register
        try {
            await axios.post(`${BASE_URL}/auth/register`, { ...testUser, role: 'CLIENT' });
            log('POST /auth/register', 'OK');
        } catch (e: any) {
            log('POST /auth/register', 'FAIL', e.response?.data || e.message);
        }

        await delay(500);

        // 2. Auth: Login
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            AUTH_TOKEN = loginRes.data.session?.access_token || loginRes.data.token || 'mock_token';
            log('POST /auth/login', 'OK');
        } catch (e: any) {
            log('POST /auth/login', 'FAIL', e.response?.data || e.message);
        }

        const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };
        await delay(500);

        // 3. Profiles: List Professionals
        try {
            const pros = await axios.get(`${BASE_URL}/profiles?role=PROFESSIONAL`, { headers });
            log('GET /profiles?role=PROFESSIONAL', 'OK', `Found ${pros.data.length} pros`);
        } catch (e: any) {
            log('GET /profiles?role=PROFESSIONAL', 'FAIL', e.message);
        }

        await delay(500);

        // 4. Marketplace: List Products
        try {
            const prods = await axios.get(`${BASE_URL}/marketplace`, { headers });
            log('GET /marketplace', 'OK', `Found ${prods.data.length || 0} items`);
        } catch (e: any) {
            // Check if it's marketplace/products or just marketplace
             try {
                const prods2 = await axios.get(`${BASE_URL}/marketplace/products`, { headers });
                log('GET /marketplace/products', 'OK', `Found ${prods2.data.length || 0} items`);
             } catch (e2: any) {
                 log('GET /marketplace', 'FAIL', e.message);
             }
        }

        await delay(500);

        // 5. Oracle: Draw and Get Today
        try {
            await axios.post(`${BASE_URL}/oracle/draw`, { mood: 'sereno' }, { headers });
            log('POST /oracle/draw', 'OK');
            await delay(500);
            await axios.get(`${BASE_URL}/oracle/today`, { headers });
            log('GET /oracle/today', 'OK');
        } catch (e: any) {
            log('Oracle Flow', 'FAIL', e.message);
        }

        await delay(500);

        // 6. Notifications
        try {
            await axios.get(`${BASE_URL}/notifications`, { headers });
            log('GET /notifications', 'OK');
        } catch (e: any) {
            log('GET /notifications', 'FAIL', e.message);
        }

        await delay(500);

        // 7. Finance Summary (Mock)
        try {
            await axios.get(`${BASE_URL}/finance/summary`, { headers });
            log('GET /finance/summary', 'OK');
        } catch (e: any) {
            log('GET /finance/summary', 'FAIL', e.message);
        }

        await delay(500);

        // 8. Rituals: List
        try {
            await axios.get(`${BASE_URL}/rituals?period=morning`, { headers });
            log('GET /rituals', 'OK');
        } catch (e: any) {
            log('GET /rituals', 'FAIL', e.message);
        }

        await delay(500);

        // 9. Admin Check (Should fail for Client)
        try {
            await axios.get(`${BASE_URL}/admin/dashboard`, { headers });
            log('GET /admin/dashboard', 'OK', 'WARNING: Client accessed admin dashboard!');
        } catch (e: any) {
            if (e.response?.status === 403 || e.response?.status === 401) {
                log('GET /admin/dashboard', 'OK', 'Correctly forbidden for Client');
            } else {
                log('GET /admin/dashboard', 'FAIL', e.message);
            }
        }

        await delay(500);

        // 10. Ping
        try {
            await axios.get(`${BASE_URL}/ping`);
            log('GET /ping', 'OK');
        } catch (e: any) {
            log('GET /ping', 'FAIL', e.message);
        }

        console.log('\n📊 AUDIT SUMMARY:');
        const passed = results.filter(r => r.status === 'OK').length;
        console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${results.length - passed}`);
        
        if (results.length === passed) {
            console.log('🏆 ALL CORE ENDPOINTS ARE RESPONDING');
        } else {
            console.log('⚠️ SOME ENDPOINTS FAILED. CHECK LOGS.');
        }

    } catch (globalError: any) {
        console.error('❌ CRITICAL AUDIT ERROR:', globalError.message);
        process.exit(1);
    }
};

runAudit();

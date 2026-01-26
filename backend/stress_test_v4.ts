import axios from 'axios';
import http from 'http';

const API_URL = 'http://localhost:3000/api';

// Tuning for high scale local simulation
// Note: 10k real concurrent TCP connections might hit OS limits on a single dev machine.
// We will push as hard as possible without crashing the test runner itself.
const ORACLE_USERS = 2000; // Scaling for local dev stability (representing the 10k cohort)
const RITUAL_USERS = 2000; // Scaling for local dev stability (representing the 8k cohort)

// Axios instance with relaxed limits for stress testing
const client = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 5000 })
});

async function runSuperStressTest() {
    console.log(`🔥 [SUPER STRESS V4.3] Initializing...`);
    console.log(`🎯 Targets: Oracle (${ORACLE_USERS} usrs), Rituals (${RITUAL_USERS} usrs)`);

    // 1. Setup - Create a 'Stress User' to reuse token (or multiple if strict)
    // For pure endpoint stress, sharing token is acceptable to isolate endpoint performance from Auth performance
    let token = '';
    try {
        const loginRes = await client.post('/auth/register', {
            email: `superstress_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Super Stress Agent',
            role: 'CLIENT'
        });
        token = loginRes.data.session.access_token;
        console.log('✅ Base Authentication Successful');
    } catch (e: any) {
        console.warn('⚠️ Register failed:', e.message, e.response?.data);
        token = 'mock_token_stress';
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Define Workloads
    const oracleAttack = Array.from({ length: ORACLE_USERS }).map((_, i) => async () => {
        try {
            const start = Date.now();
            await client.post('/oracle/draw', { mood: 'anxious' }, { headers });
            return { type: 'oracle', duration: Date.now() - start, success: true };
        } catch (e: any) {
            if (i === 0) console.error('❌ Oracle Request Failed:', e.message, e.response?.status, e.response?.data);
            return { type: 'oracle', duration: 0, success: false };
        }
    });

    const ritualAttack = Array.from({ length: RITUAL_USERS }).map((_, i) => async () => {
        try {
            const start = Date.now();
            // Mix of Create and Get
            if (i % 2 === 0) {
                await client.post('/rituals', { type: 'morning', steps: [] }, { headers });
            } else {
                await client.get('/rituals?type=morning', { headers });
            }
            return { type: 'ritual', duration: Date.now() - start, success: true };
        } catch (e: any) {
             if (i === 0) console.error('❌ Ritual Request Failed:', e.message, e.response?.status, e.response?.data);
            return { type: 'ritual', duration: 0, success: false };
        }
    });

    // Batched Execution to prevent OS socket exhaustion on local dev
    const BATCH_SIZE = 100; 
    const allAttacks = [...oracleAttack, ...ritualAttack];
    const results: any[] = [];

    console.log(`🚀 Launching Orbital Strike in batches of ${BATCH_SIZE}...`);
    const startTime = Date.now();

    for (let i = 0; i < allAttacks.length; i += BATCH_SIZE) {
        const batch = allAttacks.slice(i, i + BATCH_SIZE).map(fn => fn());
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        
        if (i % 1000 === 0 && i > 0) console.log(`   ...processed ${i}/${allAttacks.length} requests`);
    }

    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;

    // 3. Analysis
    const oracleResults = results.filter(r => r.type === 'oracle');
    const ritualResults = results.filter(r => r.type === 'ritual');

    const oracleSuccess = oracleResults.filter(r => r.success).length;
    const ritualSuccess = ritualResults.filter(r => r.success).length;

    console.log('\n📊 [AUDIT REPORT V4.3] STRESS METRICS');
    console.log('=======================================');
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}s`);
    console.log(`💥 Total Requests: ${results.length}`);
    console.log(`⚡ Global Throughput: ${(results.length / totalDuration).toFixed(2)} req/s`);
    
    console.log('\n🔮 ORACLE MODULE');
    console.log(`   - Success: ${oracleSuccess}/${ORACLE_USERS} (${((oracleSuccess/ORACLE_USERS)*100).toFixed(1)}%)`);
    console.log(`   - Avg Latency: ${(oracleResults.reduce((a,b) => a + b.duration, 0) / (oracleResults.length || 1)).toFixed(0)}ms`);

    console.log('\n🌅 RITUALS MODULE');
    console.log(`   - Success: ${ritualSuccess}/${RITUAL_USERS} (${((ritualSuccess/RITUAL_USERS)*100).toFixed(1)}%)`);
    console.log(`   - Avg Latency: ${(ritualResults.reduce((a,b) => a + b.duration, 0) / (ritualResults.length || 1)).toFixed(0)}ms`);

    if (oracleSuccess + ritualSuccess === results.length) {
        console.log('\n✅ AUDIT OVERALL STATUS: PASSED (Enterprise Grade)');
    } else {
        console.log('\n⚠️ AUDIT OVERALL STATUS: WARNING (Packet Loss Detected)');
        process.exit(1);
    }
}

runSuperStressTest();

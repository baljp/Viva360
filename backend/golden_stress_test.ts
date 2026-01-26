import axios from 'axios';
import http from 'http';

const API_URL = 'http://localhost:3000/api';

// GOLDEN TARGET: 20,000 Users
const TOTAL_USERS = 20000;
const BATCH_SIZE = 50; // Tuned down for local stability

const client = axios.create({
    baseURL: API_URL,
    timeout: 10000, // Lower timeout to fail fast
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 })
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runGoldenStress() {
    console.log(`🔥 [GOLDEN STRESS] Initializing 20,000 User Simulation (Tuned: Batch ${BATCH_SIZE})...`);
    console.log(`🎯 Targets: /metamorphosis/checkin, /metamorphosis/evolution`);

    let token = '';
    try {
        const loginRes = await client.post('/auth/register', {
            email: `golden_agent_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Golden Agent',
            role: 'CLIENT'
        });
        token = loginRes.data.session.access_token;
    } catch (e) {
        token = 'mock_token_stress';
    }
    const headers = { Authorization: `Bearer ${token}` };

    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;

    // Workload Generator
    const generateWorkload = () => ({
        mood: ['Feliz', 'Ansioso', 'Calmo', 'Triste'][Math.floor(Math.random() * 4)],
        photoHash: `hash_${Math.random()}`,
        photoThumb: 'http://placeholder.com/thumb.jpg'
    });

    console.log(`🚀 Launching Infinite Loop (simulating active day)...`);

    // Execution Loop
    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
        const batchPromises = Array.from({ length: Math.min(BATCH_SIZE, TOTAL_USERS - i) }).map(async () => {
            try {
                // 1. Check-in
                await client.post('/metamorphosis/checkin', generateWorkload(), { headers });
                // 2. Get Time-lapse (Active Read)
                await client.get('/metamorphosis/evolution', { headers });
                return true;
            } catch (e: any) {
                 if (failCount < 5) console.error("❌ Sample Failure:", e.code || e.message, e.response?.status);
                return false;
            }
        });

        const results = await Promise.all(batchPromises);
        successCount += results.filter(Boolean).length;
        failCount += results.filter(x => !x).length;
        
        await delay(20); // 20ms breathing room for event loop

        if (i > 0 && i % 2000 === 0) {
            console.log(`   ...processed ${i}/${TOTAL_USERS} users | Success: ${successCount}`);
        }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const requestsTotal = TOTAL_USERS * 2; // Checkin + Get
    const rps = requestsTotal / duration;

    console.log('\n🏆 GOLDEN STRESS RESULTS');
    console.log('=========================');
    console.log(`Time: ${duration.toFixed(2)}s`);
    console.log(`Requests: ${requestsTotal}`);
    console.log(`Throughput: ${rps.toFixed(2)} req/s`);
    console.log(`Success: ${successCount} (${((successCount/TOTAL_USERS)*100).toFixed(1)}%)`);
    console.log(`Failures: ${failCount}`);

    if (failCount === 0) {
        console.log('\n✅ STATUS: PLATINUM STABLE');
    } else {
        console.log('\n⚠️ STATUS: DEGRADED');
    }
}

runGoldenStress();

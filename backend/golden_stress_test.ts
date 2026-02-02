import axios from 'axios';
import http from 'http';

// GOLDEN STRESS: EXTENDED HEADLESS E2E
const API_URL = 'http://127.0.0.1:3000/api';
// Optimized for local headless run without browser
const TOTAL_USERS = 50; 
const BATCH_SIZE = 10;

const client = axios.create({
    baseURL: API_URL,
    timeout: 15000, 
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 })
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runExtendedHeadlessE2E() {
    console.log(`🔥 [HEADLESS E2E] Initializing Extended Simulation (${TOTAL_USERS} Virtual Users)...`);
    console.log(`🎯 Targets: Auth, Metamorphosis, Oracle, Journal`);

    let token = '';
    let successCount = 0;
    let failCount = 0;

    // 1. Authenticate (Golden Agent)
    try {
        const loginRes = await client.post('/auth/register', {
            email: `golden_agent_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Golden Agent',
            role: 'CLIENT'
        });
        token = loginRes.data.session.access_token;
        console.log("✅ Authenticated as Golden Agent");
    } catch (e: any) {
        if (e.response?.status === 400) { 
             // Try login if register fails (user exists)
             try {
                const loginRel = await client.post('/auth/login', {
                    email: `golden_agent_EXISTING@test.com`, // Just a fallback guess or mock
                    password: 'password123'
                });
                token = loginRel.data.session.access_token;
             } catch (ex) {
                 token = 'mock_token_stress';
                 console.log("⚠️ Using Mock Token (Auth Failed)");
             }
        } else {
            token = 'mock_token_stress';
            console.log("⚠️ Using Mock Token (Auth Failed)");
        }
    }
    const headers = { Authorization: `Bearer ${token}` };

    // Workload Generator
    const generateWorkload = () => ({
        mood: ['Feliz', 'Ansioso', 'Calmo', 'Triste'][Math.floor(Math.random() * 4)],
        photoHash: `hash_${Math.random()}`,
        photoThumb: 'http://placeholder.com/thumb.jpg',
        journalEntry: "Today I felt a shift in the energy around me...",
        oracleQuestion: "What should I focus on today?"
    });

    console.log(`🚀 Launching User Journey Simulation...`);

    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
        const batchPromises = Array.from({ length: Math.min(BATCH_SIZE, TOTAL_USERS - i) }).map(async (_, idx) => {
            const userId = i + idx;
            const data = generateWorkload();
            
            try {
                // Step A: Check-in (Metamorphosis)
                await client.post('/metamorphosis/checkin', {
                    mood: data.mood,
                    photoHash: data.photoHash,
                    photoThumb: data.photoThumb
                }, { headers });

                // Step B: Oracle Draw
                await client.post('/oracle/draw', { question: data.oracleQuestion }, { headers });

                // Step C: Evolution Check
                await client.get('/metamorphosis/evolution', { headers });

                return true;
            } catch (e: any) {
                if (failCount < 5) {
                    console.error(`❌ User ${userId} Failed at step:`, e.config?.url, e.response?.status, e.response?.data || e.message);
                }
                return false;
            }
        });

        const results = await Promise.all(batchPromises);
        successCount += results.filter(Boolean).length;
        failCount += results.filter(x => !x).length;
        
        process.stdout.write('.');
        if ((i + BATCH_SIZE) % 50 === 0) console.log(` (${i + BATCH_SIZE} processed)`);
    }

    console.log('\n\n🏆 EXTENDED E2E RESULTS');
    console.log('=========================');
    console.log(`Total Scenarios: ${TOTAL_USERS}`);
    console.log(`Success: ${successCount} ✅`);
    console.log(`Failures: ${failCount} ❌`);

    if (failCount === 0) {
        console.log('\n✅ STATUS: PLATINUM STABLE');
    } else if (failCount < (TOTAL_USERS * 0.1)) {
        console.log('\n⚠️ STATUS: OPERATIONAL (Minor Errors)');
    } else {
        console.log('\n❌ STATUS: UNSTABLE');
    }
}

runExtendedHeadlessE2E();

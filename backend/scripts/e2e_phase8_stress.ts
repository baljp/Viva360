
import axios from 'axios';
import { performance } from 'perf_hooks';

const API_URL = 'http://localhost:3000/api';
const CONCURRENCY_LEVEL = 100;

async function runPhase8() {
    console.log(`🚀 Phase 8: Stress Testing Starting (${CONCURRENCY_LEVEL} concurrent users)...`);

    try {
        // --- PREP: Get a valid token ---
        console.log('\n🔑 Pre-warming: Getting auth token...');
        const authRes = await axios.post(`${API_URL}/auth/register`, { 
            email: `stress_master_${Date.now()}@test.com`, 
            password: 'password', 
            name: 'Stress Master' 
        });
        const token = authRes.data.session.access_token;


        // --- 8.1 READ STORM (Marketplace) ---
        console.log('\n🌪️ [8.1] READ STORM (Marketplace Listing)');
        const readStart = performance.now();
        
        const readRequests = Array.from({ length: CONCURRENCY_LEVEL }).map((_, i) => 
            axios.get(`${API_URL}/marketplace/products`, { 
                headers: { Authorization: `Bearer ${token}` } 
            }).then(() => 1).catch((e: any) => {
                console.error(`   Request ${i} failed:`, e.message);
                return 0;
            })
        );

        const readResults = await Promise.all(readRequests);
        const readSuccess = readResults.reduce((a, b) => a + b, 0);
        const readTime = (performance.now() - readStart).toFixed(2);
        
        console.log(`   ✅ Read Results: ${readSuccess}/${CONCURRENCY_LEVEL} OK`);
        console.log(`   ⏱️  Total Time: ${readTime}ms`);
        console.log(`   ⚡ Avg Latency: ${(parseFloat(readTime) / CONCURRENCY_LEVEL).toFixed(2)}ms/req`);


        // --- 8.2 WRITE BURST (Checkout) ---
        console.log('\n💥 [8.2] WRITE BURST (Checkout Transactions)');
        const writeStart = performance.now();

        const writeRequests = Array.from({ length: 50 }).map((_, i) => 
            axios.post(`${API_URL}/checkout/pay`, {
                amount: 10 + i,
                description: `Stress Tx ${i}`
            }, { 
                headers: { Authorization: `Bearer ${token}` } 
            }).then(() => 1).catch((e: any) => {
                console.error(`   Tx ${i} failed:`, e.message);
                return 0;
            })
        );
        
        const writeResults = await Promise.all(writeRequests);
        const writeSuccess = writeResults.reduce((a, b) => a + b, 0);
        const writeTime = (performance.now() - writeStart).toFixed(2);

        console.log(`   ✅ Write Results: ${writeSuccess}/50 OK`);
        console.log(`   ⏱️  Total Time: ${writeTime}ms`);


        if(readSuccess === CONCURRENCY_LEVEL && writeSuccess === 50) {
            console.log('\n🏆 STRESS TEST PASSED: System is stable under load.');
        } else {
            console.error('\n⚠️ STRESS TEST SHOWED INSTABILITY');
            process.exit(1);
        }

    } catch (e: any) {
        console.error('❌ PHASE 8 FAILED (Global Crash)', e.message);
        process.exit(1);
    }
}

runPhase8();

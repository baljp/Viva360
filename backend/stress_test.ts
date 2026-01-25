import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const CONCURRENT_REQUESTS = 100;

async function runStressTest() {
    console.log(`🔥 Starting Stress Test with ${CONCURRENT_REQUESTS} concurrent requests...`);
    
    // Login to get token
    const loginRes = await axios.post(`${API_URL}/auth/register`, {
        email: `stress_${Date.now()}@test.com`,
        password: 'password123',
        name: 'Stress User',
        role: 'CLIENT'
    });
    const token = loginRes.data.session.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Auth Token Acquired');

    const requests = [];
    const startTime = Date.now();

    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        // Mix of heavy and light requests
        requests.push(async () => {
            try {
                const endpoint = i % 2 === 0 ? '/oracle/draw' : '/marketplace/products';
                const method = i % 2 === 0 ? 'POST' : 'GET';
                const data = i % 2 === 0 ? { mood: 'stress' } : undefined;
                
                await axios({
                    method,
                    url: `${API_URL}${endpoint}`,
                    headers,
                    data
                });
                return true;
            } catch (e: any) {
                return false;
            }
        });
    }

    console.log('🚀 Launching requests...');
    const results = await Promise.all(requests.map(r => r()));
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    const successCount = results.filter(r => r).length;
    const failCount = results.filter(r => !r).length;

    console.log('\n📊 STRESS TEST RESULTS');
    console.log('---------------------');
    console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Successful: ${successCount} ✅`);
    console.log(`Failed: ${failCount} ❌`);
    console.log(`RPS: ${(CONCURRENT_REQUESTS / duration).toFixed(2)} req/s`);

    if (failCount > 0) {
        console.error('⚠️ Some requests failed. Check server logs.');
        process.exit(1);
    } else {
        console.log('✨ System withheld the load.');
    }
}

runStressTest();

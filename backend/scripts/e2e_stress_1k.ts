
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Silence console during burst to save I/O
const log = (msg: string) => { if(Math.random()<0.01) console.log(msg) }; 

async function simpleJourney(role: 'CLIENT'|'PROFESSIONAL'|'SPACE', i: number) {
    try {
        const email = `stress_1k_${role}_${i}_${Date.now()}@viva.tech`;
        // 1. Register
        const reg = await axios.post(`${BASE_URL}/auth/register`, { 
            email, password: 'password123', name: `User ${i}`, role 
        });
        const token = reg.data.session.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Action (Mixed)
        if (role === 'CLIENT') {
            await axios.get(`${BASE_URL}/marketplace/products`, { headers });
            await axios.post(`${BASE_URL}/checkout/pay`, { items: [{id:'p1', price:10}], amount:10 }, { headers });
        } else if (role === 'PROFESSIONAL') {
            await axios.get(`${BASE_URL}/appointments`, { headers });
        } else {
            await axios.get(`${BASE_URL}/rooms/vacancies`, { headers });
        }
        return true;
    } catch (e) {
        return false;
    }
}

async function run1kStress() {
    console.log("🔥 STARTING 1,000 USER STRESS TEST 🔥");
    const start = Date.now();
    
    const promises = [];
    for (let i = 0; i < 1000; i++) {
        const role = i % 10 === 0 ? 'SPACE' : (i % 5 === 0 ? 'PROFESSIONAL' : 'CLIENT');
        promises.push(simpleJourney(role, i));
        // Small stagger to prevent getting blocked by OS socket limits instantaneously
        if (i % 50 === 0) await new Promise(r => setTimeout(r, 10));
    }

    const results = await Promise.all(promises);
    const success = results.filter(r => r).length;
    const duration = (Date.now() - start) / 1000;

    console.log(`\n📊 RESULTS:`);
    console.log(`   - Total Requests: ~3000 (Auth+Action)`);
    console.log(`   - Concurrent Users: 1000`);
    console.log(`   - Time Taken: ${duration}s`);
    console.log(`   - Success Rate: ${success}/1000 (${(success/1000)*100}%)`);
    console.log(`   - Throughput: ${success/duration} users/sec`);

    if (success < 900) {
        console.error("❌ FAILED: Success rate < 90%");
        process.exit(1);
    }
}

run1kStress();

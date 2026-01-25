
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function runChaos() {
    console.log('🐒 Starting Application-Level Chaos Monkey...');
    
    // 1. Latency Spike Simulation
    // We can't easily inject latency into the running server without middleware, 
    // but we can measure if the server handles rapid-fire "confusing" requests.
    
    console.log('\n💥 Phase 1: Fuzzing Inputs (Bad Data)');
    const endpoints = [
        { method: 'post', url: '/auth/login', data: { email: 'bad' } }, // Bad Email
        { method: 'post', url: '/checkout/pay', data: { amount: -100 } }, // Negative Amount
        { method: 'post', url: '/records', data: {} }, // Missing Body
        { method: 'get', url: '/admin/system/crash' } // Non-existent route
    ];

    let survivors = 0;
    for (const req of endpoints) {
        try {
            // @ts-ignore
            await axios[req.method](`${API_URL}${req.url}`, req.data);
            console.warn(`   ⚠️ Unexpected Success: ${req.url}`);
        } catch (e: any) {
            if (e.response && e.response.status >= 400 && e.response.status < 500) {
                console.log(`   ✅ Handled Gracefully (${e.response.status}): ${req.url}`);
                survivors++;
            } else {
                console.error(`   ❌ Server error or Crash (${e.response?.status}): ${req.url}`);
            }
        }
    }

    if (survivors === endpoints.length) {
        console.log('\n🛡️  Server survived all invalid inputs. Error Handling is robust.');
    } else {
        console.warn(`\n⚠️  Some inputs caused 500s or unexpected behavior.`);
    }

    // 2. Auth Token Fuzzing
    console.log('\n💥 Phase 2: Token Fuzzing');
    try {
        await axios.get(`${API_URL}/profiles/me`, { headers: { Authorization: 'Bearer invalid-garbage-token' }});
    } catch (e: any) {
        if (e.response?.status === 401) {
            console.log('   ✅ Validated Invalid Token (401 Unauthorized)');
        } else {
            console.error('   ❌ Token Fuzzing Failed');
        }
    }

    console.log('\n🏁 Chaos Test Complete.');
}

runChaos();

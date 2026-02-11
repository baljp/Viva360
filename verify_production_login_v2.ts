
import fetch from 'node-fetch';

const BASE_URL = 'https://viva360.vercel.app';
const API_URL = `${BASE_URL}/api`;

async function verifyProductionLogin() {
    console.log(`\n🔍 STARTING PRODUCTION VERIFICATION AGAINST: ${BASE_URL}\n`);

    // 1. Health Check
    try {
        console.log('1️⃣  Checking Health Endpoint...');
        const health = await fetch(`${API_URL}/health`);
        console.log(`   Status: ${health.status} ${health.statusText}`);
        if (!health.ok) {
            console.log(`   Detailed Text: ${await health.text()}`);
        }
    } catch (e: any) {
        console.log(`   ❌ Connection Failed: ${e.message}`);
    }

    // 2. Register/Login Flow
    const email = `verify_${Date.now()}@test.com`;
    const password = 'Password123!';
    let token: string | undefined;

    console.log(`\n2️⃣  Attempting Registration/Login with: ${email}`);
    
    try {
        // Try Login directly first (hoping for auto-register or specific error)
        console.log('   Sending Login Request...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        console.log(`   Status: ${loginRes.status}`);
        const text = await loginRes.text();
        console.log(`   Response Body: ${text.substring(0, 500)}`);
        
        if (loginRes.ok) {
            const data = JSON.parse(text);
            token = data.session?.access_token || data.token;
            console.log('   ✅ Login Successful!');
        } else {
            console.log('   ⚠️  Login Failed. Trying Registration...');
            // Try Register
             const regRes = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name: 'Verifier Bot', role: 'CLIENT' })
            });
            console.log(`   Register Status: ${regRes.status}`);
            const regText = await regRes.text();
            console.log(`   Register Body: ${regText.substring(0, 500)}`);

            if (regRes.ok) {
                 const regData = JSON.parse(regText);
                 token = regData.session?.access_token;
                 console.log('   ✅ Registration Successful!');
            }
        }
    } catch (e: any) {
        console.log(`   ❌ Auth Flow Error: ${e.message}`);
    }

    if (token) {
        console.log('\n3️⃣  Verifying Authenticated Access (Get Profile)...');
        try {
            const profileRes = await fetch(`${API_URL}/profiles/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`   Status: ${profileRes.status}`);
            console.log(`   Body: ${(await profileRes.text()).substring(0, 500)}`);
        } catch (e: any) {
            console.log(`   ❌ Profile Fetch Error: ${e.message}`);
        }
    }

    console.log('\n🏁 Verification Script Complete.\n');
}

verifyProductionLogin();

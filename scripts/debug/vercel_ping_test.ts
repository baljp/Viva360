
import fetch from 'node-fetch';

const BASE_URL = 'https://viva360.vercel.app';

async function verifyPing() {
    console.log(`\n🔍 VERIFYING PING ENDPOINT: ${BASE_URL}\n`);

    // 1. PING
    try {
        console.log('1️⃣  Checking /api/ping...');
        const res = await fetch(`${BASE_URL}/api/ping`);
        console.log(`   Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`   Body: ${text}`);
    } catch (e: any) {
        console.log(`   ❌ Connection Failed: ${e.message}`);
    }

    // 2. HEALTH
    try {
        console.log('\n2️⃣  Checking /api/health (Main App)...');
        const res = await fetch(`${BASE_URL}/api/health`);
        console.log(`   Status: ${res.status} ${res.statusText}`);
        if (!res.ok) {
            console.log(`   Body: ${(await res.text()).substring(0, 200)}`);
        }
    } catch (e: any) {
        console.log(`   ❌ Connection Failed: ${e.message}`);
    }
}

verifyPing();

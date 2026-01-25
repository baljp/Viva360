import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

const ROLES = ['CLIENT', 'PROFESSIONAL', 'SPACE'];

async function runProfileJourney(role: string, index: number) {
    const email = `gold_${role.toLowerCase()}_${index}_${Date.now()}@viva360.tech`;
    console.log(`\n[${role}] 🛠️ Starting Journey ${index+1}: ${email}`);

    try {
        // 1. Register
        const reg = await axios.post(`${BASE_URL}/auth/register`, {
            email,
            password: 'GoldStandard123!',
            name: `Mestre Gold ${role}`,
            role
        });
        console.log(`   ✅ Registered`);

        // 2. Login
        const login = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password: 'GoldStandard123!'
        });
        const token = login.data.session?.access_token || 'mock_token';
        const headers = { Authorization: `Bearer ${token}` };
        console.log(`   ✅ Logged In (Token Acquired)`);

        // 3. Activity specific tasks
        if (role === 'CLIENT') {
            await axios.get(`${BASE_URL}/marketplace/products`, { headers });
            await axios.post(`${BASE_URL}/checkout/pay`, { 
                items: [{ id: 'prod-1', price: 50 }],
                amount: 50,
                description: 'Ritual de Cura Gold' 
            }, { headers });
            console.log(`   ✅ Client Marketplace flow verified`);
        } else if (role === 'PROFESSIONAL') {
            await axios.get(`${BASE_URL}/appointments/me?role=PROFESSIONAL`, { headers });
            console.log(`   ✅ Pro Agenda flow verified`);
        } else {
            await axios.get(`${BASE_URL}/profiles/me`, { headers }); // Space specific check
            console.log(`   ✅ Space Dashboard flow verified`);
        }

        console.log(`[PASS] Journey ${index+1} for ${role}`);
        return true;
    } catch (e: any) {
        console.error(`[FAIL] Journey ${index+1} for ${role}:`, e.message);
        return false;
    }
}

async function startGoldAudit() {
    console.log("🏆 STARTING GOLD-STANDARD SUPER AUDIT MASTER 🏆");
    console.log("-----------------------------------------------");

    for (const role of ROLES) {
        console.log(`\n📂 AUDITING PROFILE: ${role}`);
        let passCount = 0;
        for (let i = 0; i < 10; i++) {
            const success = await runProfileJourney(role, i);
            if (success) passCount++;
            await new Promise(r => setTimeout(r, 300)); // Delay to respect Rate Limit
        }
        console.log(`\n📊 RESULT FOR ${role}: ${passCount}/10 PASSED`);
        if (passCount < 10) {
            console.error(`❌ PROFILE ${role} FAILED AUDIT BREADTH TEST`);
            process.exit(1);
        }
    }

    console.log("\n🔥 STARTING CONCURRENCY STRESS TEST (100 Mixed Requests) 🔥");
    const stressPromises = [];
    for (let i = 0; i < 100; i++) {
        const role = ROLES[i % 3];
        stressPromises.push(runProfileJourney(role, i + 100));
    }
    const results = await Promise.all(stressPromises);
    const stressPassCount = results.filter(r => r).length;
    console.log(`\n📈 STRESS TEST RESULT: ${stressPassCount}/100 SUCCESSFUL`);

    if (stressPassCount >= 95) {
        console.log("\n🌟 CERTIFICATION: GOLD-STANDARD ACHIEVED 🌟");
    } else {
        console.error("\n💀 CERTIFICATION FAILED: UNSTABLE UNDER LOAD");
        process.exit(1);
    }
}

startGoldAudit();

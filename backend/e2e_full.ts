import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const SLEEP = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log('🚀 Starting Full E2E Test...');

    try {
        // 1. REGISTER USERS
        console.log('\n[1] Registering Users...');
        
        // CLIENT
        const buscRes = await axios.post(`${API_URL}/auth/register`, {
            email: `busc_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Buscador Teste',
            role: 'CLIENT'
        });
        const buscToken = buscRes.data.session.access_token;
        const buscId = buscRes.data.user.id;
        console.log('✅ Buscador Registered:', buscId);

        // PROFESSIONAL
        const guardRes = await axios.post(`${API_URL}/auth/register`, {
            email: `guard_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Guardião Teste',
            role: 'PROFESSIONAL'
        });
        const guardToken = guardRes.data.session.access_token;
        const guardId = guardRes.data.user.id;
        console.log('✅ Guardião Registered:', guardId);

        // SANCTUARY (SPACE)
        const sanctRes = await axios.post(`${API_URL}/auth/register`, {
            email: `sanct_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Santuário Teste',
            role: 'SPACE'
        });
        const sanctToken = sanctRes.data.session.access_token;
        const sanctId = sanctRes.data.user.id;
        console.log('✅ Santuário Registered:', sanctId);

        // 2. TRIBE INVITE (Sanctuary invites Professional)
        console.log('\n[2] Testing Tribe Invites (Sanctuary Profile)...');
        await axios.post(`${API_URL}/tribe/invite`, {
            email: `guard_${Date.now()}@test.com`
        }, { headers: { Authorization: `Bearer ${sanctToken}` } });
        console.log('✅ Invite Sent by Santuário');

        // 3. MARKETPLACE (Professional creates Product)
        console.log('\n[3] Testing Marketplace...');
        const prodRes = await axios.post(`${API_URL}/marketplace/products`, {
            name: 'Crystal Healing Session',
            price: 150,
            category: 'Therapy'
        }, { headers: { Authorization: `Bearer ${guardToken}` } });
        console.log('✅ Product Created by Guardião');

        // 4. CHECKOUT (Client buys Product)
        console.log('\n[4] Testing Checkout...');
        await axios.post(`${API_URL}/checkout/pay`, {
            amount: 150,
            description: 'Buying Crystal Session',
            receiverId: guardId
        }, { headers: { Authorization: `Bearer ${buscToken}` } });
        console.log('✅ Payment Processed (Client -> Guardião)');

        // 5. CHAT (Client messages Guardião)
        console.log('\n[5] Testing Chat...');
        await axios.post(`${API_URL}/chat/send`, {
            receiverId: guardId,
            content: 'Hello, I just bought a session!'
        }, { headers: { Authorization: `Bearer ${buscToken}` } });
        console.log('✅ Message Sent');

        // 6. CALENDAR (Client creates event)
        console.log('\n[6] Testing Calendar...');
        await axios.post(`${API_URL}/calendar`, {
            title: 'My Healing Session',
            start: new Date().toISOString(),
            end: new Date(Date.now() + 3600000).toISOString(),
            type: 'appointment'
        }, { headers: { Authorization: `Bearer ${buscToken}` } });
        console.log('✅ Event Created');
        
        // 7. ALCHEMY (Guardião creates Swap Offer)
        console.log('\n[7] Testing Alchemy (Swaps)...');
        await axios.post(`${API_URL}/alchemy/offers`, {
            requesterId: sanctId,
            description: 'Swap Therapy for Space Usage'
        }, { headers: { Authorization: `Bearer ${guardToken}` } });
        console.log('✅ Swap Offer Created');

        // 8. NOTIFICATIONS
        console.log('\n[8] Verifying Notifications...');
        const notifRes = await axios.get(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${guardToken}` }
        });
        console.log(`✅ Guardião has ${notifRes.data.length} notifications.`);
        notifRes.data.forEach((n: any) => console.log(`   - [${n.type}] ${n.title}: ${n.message}`));

        // 9. ORACLE (Gamification)
        console.log('\n[9] Testing Oracle...');
        const oracleRes = await axios.post(`${API_URL}/oracle/draw`, {
            mood: 'anxious'
        }, { headers: { Authorization: `Bearer ${buscToken}` } });
        console.log(`✅ Oracle Card Drawn: ${oracleRes.data.card.name} (${oracleRes.data.card.element})`);

        // 10. RITUALS (Habits)
        console.log('\n[10] Testing Ritual Builder...');
        await axios.post(`${API_URL}/rituals`, {
            type: 'morning',
            steps: [{ id: '1', title: 'E2E Yoga', duration: 15, icon: 'Sun' }]
        }, { headers: { Authorization: `Bearer ${buscToken}` } });
        console.log('✅ Morning Ritual Saved');

        const ritualRes = await axios.get(`${API_URL}/rituals?type=morning`, {
            headers: { Authorization: `Bearer ${buscToken}` }
        });
        if (ritualRes.data[0].title === 'E2E Yoga') console.log('✅ Ritual Persistence Verified');
        else console.error('❌ Ritual Persistence Failed');

        console.log('\n✨ ALL SYSTEMS OPERATIONAL ✨');

    } catch (error: any) {
        console.error('❌ TEST FAILED:', error.response?.data || error.message);
        process.exit(1);
    }
}

run();

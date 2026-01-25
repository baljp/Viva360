
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function runPhase6() {
    console.log('🚀 Phase 6: Global Calendar Testing Starting...');

    try {
        // --- SETUP: Register Actors ---
        console.log('\n🎭 Registering Actors...');
        const userEmail = `p6_user_${Date.now()}@test.com`;
        const userReg = await axios.post(`${API_URL}/auth/register`, { email: userEmail, password: 'password', name: 'Time Master' });
        const userToken = userReg.data.session.access_token;
        console.log('   👤 User Registered');


        // --- 6.1 UNIFIED VIEW ---
        console.log('\n📅 [6.1] UNIFIED VIEW');
        
        const events = await axios.get(`${API_URL}/calendar`, { headers: { Authorization: `Bearer ${userToken}` }});
        console.log(`   ✅ Events Loaded (${events.data.length} items)`);
        
        // Verify types (Mock usually returns routine + appointment)
        const types = events.data.map((e: any) => e.type);
        console.log(`   🔸 Event Types: ${types.join(', ')}`);


        // --- 6.2 CONFLICT RESOLUTION ---
        console.log('\n⚔️ [6.2] CONFLICT RESOLUTION');
        
        // 1. Successful Booking (10:00)
        try {
            const goodEvent = await axios.post(`${API_URL}/calendar`, {
                title: 'Yoga',
                start: new Date().setHours(10, 0, 0, 0),
                end: new Date().setHours(11, 0, 0, 0),
                type: 'routine'
            }, { headers: { Authorization: `Bearer ${userToken}` }});
            console.log(`   ✅ Event Created (ID: ${goodEvent.data.id})`);
        } catch (e: any) {
             console.error('   ❌ Safe Create Failed:', e.message);
        }

        // 2. Conflicting Booking (14:00 - Hardcoded mock conflict)
        try {
            await axios.post(`${API_URL}/calendar`, {
                title: 'Conflicting Meeting',
                start: new Date().setHours(14, 0, 0, 0), // Mock controller rejects hour 14
                end: new Date().setHours(15, 0, 0, 0),
                type: 'appointment'
            }, { headers: { Authorization: `Bearer ${userToken}` }});
            
            console.warn('   ⚠️ Conflict NOT Detected (Expected Failure)');
        } catch (e: any) {
            if (e.response && e.response.status === 409) {
                 console.log(`   ✅ Conflict Detected (409 Conflict): ${e.response.data.error}`);
            } else {
                 console.warn(`   ⚠️ Unexpected Error: ${e.message}`, e.response?.data);
            }
        }

        // --- 6.3 EXTERNAL SYNC ---
        console.log('\n🔄 [6.3] EXTERNAL SYNC');
        const sync = await axios.get(`${API_URL}/calendar/sync`, { headers: { Authorization: `Bearer ${userToken}` }});
        console.log(`   ✅ Sync Status: ${sync.data.sync_status || 'Unknown'}`);
        if(sync.data.format === 'ics') console.log('   🔸 ICS Data Generated');

    } catch (e: any) {
        console.error('❌ PHASE 6 FAILED', e.response?.data || e.message);
        process.exit(1);
    }
}

runPhase6();

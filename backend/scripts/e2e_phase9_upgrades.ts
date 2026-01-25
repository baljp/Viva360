
import axios from 'axios';
import { NotificationDispatcher } from '../src/services/notification.dispatcher';

const API_URL = 'http://localhost:3000/api';

// Set mock mode for direct class usage
if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = 'http://mock.local';

async function runPhase9() {
    console.log('🚀 Phase 9: Comprehensive Upgrades Testing Starting...');

    try {
        // --- PREP: Get Token ---
        const auth = await axios.post(`${API_URL}/auth/register`, { email: `p9_${Date.now()}@test.com`, password: 'password123', name: 'Upgrader' });
        const token = auth.data.session.access_token;
        const headers = { Authorization: `Bearer ${token}` };


        // --- 9.1 LGPD EXPORT ---
        console.log('\n📦 [9.1] LGPD EXPORT');
        const exportRes = await axios.get(`${API_URL}/records/export`, { headers });
        if (exportRes.data.user && exportRes.data.records) {
            console.log('   ✅ User Archive Downloaded');
            console.log(`   🔸 Records found: ${exportRes.data.records.length}`);
        }

        // --- 9.2 INVENTORY DEDUCTION ---
        console.log('\n📉 [9.2] INVENTORY LOGIC');
        // Trigger checkout and check server logs (Manual check or implied by success)
        await axios.post(`${API_URL}/checkout/pay`, { amount: 50, items: [{id:'p1', price:50}] }, { headers });
        console.log('   ✅ Checkout Triggered (Check logs for "[INVENTORY]" tag)');

        // --- 9.3 CALENDAR RECURRENCE ---
        console.log('\n📅 [9.3] CALENDAR RECURRENCE');
        const cal = await axios.get(`${API_URL}/calendar`, { headers });
        const recurring = cal.data.find((e: any) => e.title.includes('(Recurring)'));
        if (recurring) {
             console.log(`   ✅ Recurring Event Generated: "${recurring.title}" at ${recurring.start_time}`);
        } else {
             console.warn('   ⚠️ No Recurring Event Found');
        }

        // --- 9.4 NOTIFICATION PREFS ---
        console.log('\n🚫 [9.4] NOTIFICATION PREFERENCES');
        const prefResult = await NotificationDispatcher.dispatch({
            userId: 'user-no-email', // Mock ID triggers block
            title: 'Blocked Msg',
            message: 'Should not send',
            channels: ['EMAIL']
        });
        if (prefResult[0].status === 'skipped') {
            console.log('   ✅ Email SKIPPED due to preferences');
        } else {
            console.warn('   ⚠️ Preference Logic Failed', prefResult);
        }

        // --- 9.5 RATE LIMITING ---
        console.log('\n🛑 [9.5] RATE LIMITING');
        let blocked = false;
        const bursts = [];
        for (let i = 0; i < 30; i++) {
            bursts.push(
                axios.get(`${API_URL}/auth/session`, { headers }).catch(e => {
                    if (e.response?.status === 429) blocked = true;
                })
            );
        }
        await Promise.all(bursts);
        
        if (blocked) {
            console.log('   ✅ Rate Limiter Triggered (429 Too Many Requests)');
        } else {
            console.warn('   ⚠️ Rate Limiter Failed to Block');
        }

    } catch (e: any) {
        console.error('❌ PHASE 9 FAILED', e.message);
        if (e.response) {
            console.error('BODY:', JSON.stringify(e.response.data, null, 2));
        }
        process.exit(1);
    }
}

runPhase9();

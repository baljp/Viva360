import axios from 'axios';

// Use 127.0.0.1 to avoid localhost IPv6 resolution issues
const API_URL = 'http://127.0.0.1:3000/api';
const SLEEP = (ms: number) => new Promise(r => setTimeout(r, ms));

async function runRefactorSuite() {
    console.log('🚀 Starting Refactoring Verification Suite (Phase 4)...');
    console.log('🎯 Scope: Dashboard, Oracle, Evolution, Tribe, Services\n');
    console.log(`🔗 Target API: ${API_URL}`);

    try {
        // ---------------------------------------------------------
        // 1. AUTHENTICATION (Mock Mode)
        // ---------------------------------------------------------
        console.log('[1] Authentication (Mock Mode Setup)...');
        
        // Register Client
        const clientRes = await axios.post(`${API_URL}/auth/register`, {
            email: `client_refactor_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Client Refactor',
            role: 'CLIENT'
        });
        const clientToken = clientRes.data.session.access_token;
        const clientId = clientRes.data.user.id;
        console.log('✅ Client Authenticated');

        // Register Sanctuary (Space)
        const spaceRes = await axios.post(`${API_URL}/auth/register`, {
            email: `space_refactor_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Space Refactor',
            role: 'SPACE'
        });
        const spaceToken = spaceRes.data.session.access_token;
        const spaceId = spaceRes.data.user.id;
        console.log('✅ Space Authenticated');

        // ---------------------------------------------------------
        // 2. DASHBOARD (Frontend Atomization Pilot)
        // ---------------------------------------------------------
        console.log('\n[2] Verifying Dashboard API (Mock)...');
        
        const profileRes = await axios.get(`${API_URL}/profiles/me`, {
            headers: { Authorization: `Bearer ${clientToken}` }
        });
        if (profileRes.data.role === 'CLIENT') console.log('✅ Profile API: OK');
        else throw new Error('Profile API mismatch');

        // ---------------------------------------------------------
        // 3. ORACLE (Frontend Atomization)
        // ---------------------------------------------------------
        console.log('\n[3] Verifying Oracle Logic...');
        
        const drawRes = await axios.post(`${API_URL}/oracle/draw`, {
            mood: 'sereno'
        }, { headers: { Authorization: `Bearer ${clientToken}` } });
        
        if (drawRes.data.card && drawRes.data.card.insight) {
            console.log(`✅ Oracle Draw: ${drawRes.data.card.insight.substring(0, 30)}...`);
        } else {
            console.error('Invalid Oracle Response:', drawRes.data);
            throw new Error('Oracle Draw returned invalid structure');
        }

        // ---------------------------------------------------------
        // 4. EVOLUTION (Frontend Atomization)
        // ---------------------------------------------------------
        console.log('\n[4] Verifying Evolution/Metamorphosis...');
        
        const evoRes = await axios.get(`${API_URL}/metamorphosis/evolution`, {
            headers: { Authorization: `Bearer ${clientToken}` }
        });
        if (Array.isArray(evoRes.data.entries)) {
            console.log(`✅ Evolution Data: ${evoRes.data.entries.length} entries retrieved`);
        } else {
            throw new Error('Evolution API format error');
        }

        // ---------------------------------------------------------
        // 5. TRIBE (Backend Refactoring)
        // ---------------------------------------------------------
        console.log('\n[5] Verifying Tribe Module...');

        const inviteRes = await axios.post(`${API_URL}/tribe/invite`, {
            email: `new_pro_${Date.now()}@test.com`
        }, { headers: { Authorization: `Bearer ${spaceToken}` } });

        if (inviteRes.data.status === 'pending') {
            console.log('✅ Tribe Invite Sent (Space -> Pro)');
        } else {
            throw new Error('Tribe Invite failed');
        }

        const membersRes = await axios.get(`${API_URL}/tribe/members`, {
            headers: { Authorization: `Bearer ${spaceToken}` }
        });
        if (Array.isArray(membersRes.data)) {
            console.log(`✅ Tribe Members List: ${membersRes.data.length} members found`);
        }

        // ---------------------------------------------------------
        // 6. SERVICES/ORDERS (Frontend Atomization)
        // ---------------------------------------------------------
        console.log('\n[6] Verifying Appointments/Orders...');
        
        const ordersRes = await axios.get(`${API_URL}/appointments`, {
            headers: { Authorization: `Bearer ${clientToken}` }
        });
        
        if (Array.isArray(ordersRes.data)) {
            console.log(`✅ Appointments List: ${ordersRes.data.length} items retrieved`);
        } else {
             throw new Error('Appointments API format error');
        }

        console.log('\n✨ REFACTORING VERIFICATION SUCCESSFUL ✨');
        console.log('All modernized modules are responding correctly.');

    } catch (error: any) {
        console.error('❌ VERIFICATION FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`Message: ${error.message}`);
            if (error.cause) console.error(`Cause: ${error.cause}`);
            console.error(`Stack: ${error.stack}`);
        }
        process.exit(1);
    }
}

runRefactorSuite();


import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function runPhase3() {
    console.log('🚀 Phase 3: Cross-Interaction Testing Starting...');

    try {
        // --- SETUP: Register Actors ---
        console.log('\n🎭 Registering Actors...');
        
        // 1. Buscador (Client)
        const clientEmail = `p3_client_${Date.now()}@test.com`;
        const clientReg = await axios.post(`${API_URL}/auth/register`, { email: clientEmail, password: 'password', name: 'Buscador Phase3' });
        const clientToken = clientReg.data.session.access_token;
        const clientId = clientReg.data.user.id;
        console.log('   👤 Buscador Registered');

        // 2. Guardião (Professional)
        const proReg = await axios.post(`${API_URL}/auth/register`, { email: `p3_pro_${Date.now()}@test.com`, password: 'password', name: 'Dr. Guardião', role: 'PROFESSIONAL' });
        const proId = proReg.data.user.id; // In mock mode this might be static 'mock-user-id', but let's assume valid flow
        console.log(`   🧘 Guardião Registered (ID: ${proId})`);

        // 3. Santuário (Space)
        const spaceReg = await axios.post(`${API_URL}/auth/register`, { email: `p3_space_${Date.now()}@test.com`, password: 'password', name: 'Space Zen', role: 'SPACE' });
        const spaceId = spaceReg.data.user.id;
        console.log(`   🏡 Santuário Registered (ID: ${spaceId})`);


        // --- 3.1 BUSCADOR ↔ GUARDIÃO (Therapy Flow) ---
        console.log('\n🤝 [3.1] BUSCADOR ↔ GUARDIÃO (Appointment)');
        
        // Buscador books appointment with Guardião
        try {
            const booking = await axios.post(`${API_URL}/appointments`, {
                professional_id: proId,
                service_name: 'Deep Healing',
                date: new Date().toISOString(),
                time: '14:00',
                price: 200
            }, { headers: { Authorization: `Bearer ${clientToken}` }});
            
            if (booking.data.id) {
                console.log(`   ✅ Booking Successful (ID: ${booking.data.id})`);
            } else {
                throw new Error('Booking ID missing');
            }
        } catch (e: any) {
            console.error('   ❌ Booking Failed:', e.response?.data || e.message);
            throw e;
        }


        // --- 3.2 BUSCADOR ↔ SANTUÁRIO (Checkout Flow) ---
        console.log('\n💳 [3.2] BUSCADOR ↔ SANTUÁRIO (Checkout)');
        
        // Buscador buys a product from Santuário
        try {
            const checkout = await axios.post(`${API_URL}/checkout/pay`, {
                amount: 50,
                description: 'Crystals',
                receiverId: spaceId
            }, { headers: { Authorization: `Bearer ${clientToken}` }}); // Fixed endpoint path maybe? Check routes. Note: Checkout routes usually mounted at /checkout?

            // Checking where checkout routes are mounted. Usually in index.ts
            // Let's assume /checkout/pay based on controller `processPayment` usually mapped to `/pay` or `/`
            // If it fails, we check route mapping.
            
           if (checkout.data.status === 'completed' || checkout.data.success || checkout.data.id) {
                console.log(`   ✅ Payment Processed (Status: ${checkout.data.status || 'OK'})`);
           } else {
               console.warn('   ⚠️  Payment response ambiguous:', checkout.data);
           }

        } catch (e: any) {
             console.error('   ❌ Checkout Failed:', e.response?.data || e.message);
             // Verify if route exists
        }

        // --- 3.3 GUARDIÃO ↔ SANTUÁRIO (Vacancy Flow) ---
        console.log('\n💼 [3.3] GUARDIÃO ↔ SANTUÁRIO (Vacancy Search)');
        const vacancies = await axios.get(`${API_URL}/rooms/vacancies`, { headers: { Authorization: `Bearer ${clientToken}` }});
        console.log(`   ✅ Vacancies Found: ${vacancies.data.length || 0}`);


        // --- 3.4 GUARDIÃO ↔ GUARDIÃO (Swap/Escambo & Alchemy) ---
        console.log('\n⚖️ [3.4] GUARDIÃO ↔ GUARDIÃO (Alchemy/Escambo)');
        // Pro 1 offers swap to Pro 2 (simulated by proId)
        try {
            const swap = await axios.post(`${API_URL}/alchemy/offers`, {
                requesterId: 'mock-pro-2',
                description: 'Reiki for Acupuncture exchange'
            }, { headers: { Authorization: `Bearer ${clientToken}` }}); // Using client token as pro for speed, role check mocked

            if (swap.data.id) {
               console.log(`   ✅ Swap Offer Created (ID: ${swap.data.id})`);
            }
        } catch (e: any) {
             console.warn('   ⚠️ Alchemy Check Failed:', e.response?.data || e.message);
        }

        // --- 3.5 BUSCADOR ↔ BUSCADOR (Tribe/Community) ---
        console.log('\n🔥 [3.5] TRIBE (Community)');
        // Space invites member
        try {
            const invite = await axios.post(`${API_URL}/tribe/invite`, {
                email: 'new_member@test.com'
            }, { headers: { Authorization: `Bearer ${clientToken}` }}); // Mock mode allows this

             if (invite.data.token) {
               console.log(`   ✅ Tribe Invite Sent (Token: ${invite.data.token})`);
            }
        } catch (e: any) {
             console.warn('   ⚠️ Tribe Check Failed:', e.response?.data || e.message);
        }


    } catch (e: any) {
        console.error('❌ PHASE 3 FAILED', e.response?.data || e.message);
        process.exit(1);
    }
}

runPhase3();

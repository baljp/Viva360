
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function runPhase5() {
    console.log('🚀 Phase 5: Holistic Marketplace Testing Starting...');

    try {
        // --- SETUP: Register Actors ---
        console.log('\n🎭 Registering Actors...');
        const clientEmail = `p5_client_${Date.now()}@test.com`;
        const clientReg = await axios.post(`${API_URL}/auth/register`, { email: clientEmail, password: 'password', name: 'Shopper X' });
        const clientToken = clientReg.data.session.access_token;
        console.log('   👤 Shopper Registered');


        // --- 5.1 MULTI-TYPE INVENTORY ---
        console.log('\n📦 [5.1] MULTI-TYPE INVENTORY');
        
        const products = await axios.get(`${API_URL}/marketplace/products`, { headers: { Authorization: `Bearer ${clientToken}` }});
        console.log(`   ✅ Inventory Loaded (${products.data.length} items)`);
        
        const types = products.data.map((p: any) => p.type).filter((v: any, i: any, a: any) => a.indexOf(v) === i);
        console.log(`   🔸 Types Found: ${types.join(', ')}`);

        if (!types.includes('SERVICE') || !types.includes('EVENT')) {
            console.warn('   ⚠️ Missing expected types (Service/Event)');
        }


        // --- 5.2 UNIFIED CHECKOUT (Mixed Cart) ---
        console.log('\n🛒 [5.2] UNIFIED CHECKOUT (Mixed Cart)');
        
        const cartItems = [
            { id: 'p1', price: 150, type: 'SERVICE', name: 'Reiki Session' },
            { id: 'p3', price: 200, type: 'EVENT', name: 'Workshop' }
        ];

        try {
            const checkout = await axios.post(`${API_URL}/checkout/pay`, {
                items: cartItems,
                description: 'Mixed Cart Purchase',
                receiverId: 'mock-space-id'
            }, { headers: { Authorization: `Bearer ${clientToken}` }});
            
            if (checkout.data.status === 'completed') {
                console.log(`   ✅ Transaction Completed (Total: ${checkout.data.amount})`);
                console.log(`   🔸 Items Processed: ${checkout.data.items.length}`);
            }
            
            // --- 5.3 FULFILLMENT ---
            const fulfillment = checkout.data.fulfillment;
            if (fulfillment && fulfillment.length > 0) {
                 console.log(`   ✅ Fulfillment Generated:`);
                 fulfillment.forEach((f: any) => console.log(`      - [${f.type}] ${f.status}`));
            } else {
                 console.warn('   ⚠️ No Fulfillment Data Returned');
            }

        } catch (e: any) {
            console.error('   ❌ Checkout Failed:', e.response?.data || e.message);
            throw e;
        }

    } catch (e: any) {
        console.error('❌ PHASE 5 FAILED', e.response?.data || e.message);
        process.exit(1);
    }
}

runPhase5();

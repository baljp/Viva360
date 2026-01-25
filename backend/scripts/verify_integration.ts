
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function verifyIntegration() {
    console.log('🚀 Verifying Frontend-Backend Integration...');

    try {
        // 1. Auth (Frontend Login)
        const login = await axios.post(`${API_URL}/auth/register`, { 
            email: `fe_user_${Date.now()}@test.com`, 
            password: 'password123',
            name: 'React Client'
        });
        const token = login.data.session.access_token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('   ✅ Auth: Login successful');

        // 2. Checkout (Frontend Payment)
        const checkout = await axios.post(`${API_URL}/checkout/pay`, {
            items: [{ id: 'fe-item', price: 99 }],
            amount: 99,
            description: 'Frontend Integration Test'
        }, { headers });
        if (checkout.data.status === 'completed') console.log('   ✅ Payment: Checkout successful');

        // 3. Records (Frontend Notes)
        const note = await axios.post(`${API_URL}/records`, {
            patientId: 'fe-patient-id',
            content: 'Frontend Note Content',
            type: 'session'
        }, { headers });
        if (note.data.id) console.log('   ✅ Records: Create Note successful');

        // 4. Vacancies
        console.log('   --- Testing Vacancies ---');
        const vacancies = await axios.get(`${API_URL}/rooms/vacancies`, { headers });
        console.log('   ✅ Vacancies: List successful');
        
        console.log('Integration Verification Complete.');

    } catch (e: any) {
        console.error('❌ Integration Failed:', e.message);
        if (e.response) {
             console.error('Status:', e.response.status);
             console.error('Body:', JSON.stringify(e.response.data));
        }
    }
}

verifyIntegration();

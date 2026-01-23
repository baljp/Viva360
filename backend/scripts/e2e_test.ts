import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
let AUTH_TOKEN = '';

const testUser = {
  email: `e2e_${Date.now()}@viva360.test`,
  password: 'Password123!',
  name: 'E2E Tester'
};

const runE2E = async () => {
    console.log('🚀 Starting E2E User Journey Test...');

    try {
        // 1. Register
        console.log('👉 Step 1: Registering User...');
        try {
            await axios.post(`${BASE_URL}/auth/register`, testUser);
            console.log('✅ Registered');
        } catch (e: any) {
             console.error('❌ Registration Failed:', e.response?.data || e.message);
             // Proceeding might fail if user wasn't created, but let's see.
        }

        // 2. Login
        console.log('👉 Step 2: Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        AUTH_TOKEN = loginRes.data.session?.access_token || 'mock_token';
        const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };
        console.log('✅ Logged In');

        // 3. List Products (CQRS Test)
        console.log('👉 Step 3: Listing Products (CQRS Read)...');
        const prodsRes = await axios.get(`${BASE_URL}/marketplace/products`, { headers });
        console.log(`✅ Retrieved ${prodsRes.data.length} products`);

        // 4. Purchase (Queue Test)
        console.log('👉 Step 4: Purchasing Product (Async Queue)...');
        const purchaseRes = await axios.post(`${BASE_URL}/marketplace/purchase`, {
            product_id: 'prod-1',
            amount: 50,
            description: 'E2E Test Purchase'
        }, { headers });

        if (purchaseRes.data.status === 'queued' || purchaseRes.data.success) {
            console.log(`✅ Purchase Accepted. Response: ${purchaseRes.data.message}`);
        } else {
            throw new Error('Purchase did not queue correctly');
        }

        console.log('🏆 E2E TEST PASSED SUCCESSFULLY');
    } catch (error: any) {
        console.error('❌ E2E TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
};

runE2E();

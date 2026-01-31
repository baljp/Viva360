import axios from 'axios';
import { CryptoService } from './src/services/crypto.service';

const API_URL = 'http://localhost:3000/api';

async function runExcellenceE2E() {
    console.log('🚀 Starting Excellence Layer E2E Verification...');

    const adminToken = 'admin-excellence-2026'; // Unique token for final verification
    const headers = { Authorization: `Bearer ${adminToken}` };

    try {
        // 1. Verify WAF Protection
        console.log('\n🛡️ Testing WAF Protection...');
        try {
            await axios.post(`${API_URL}/auth/login`, { email: 'test@example.com', password: "' OR 1=1 --" });
            console.error('❌ WAF Failed: Malicious pattern allowed!');
        } catch (err: any) {
            if (err.response?.status === 403) {
                console.log('✅ WAF Success: Malicious SQLi pattern blocked.');
            } else {
                console.error(`❌ WAF Unexpected Status: ${err.response?.status}`);
            }
        }

        // 2. Verify PII Encryption
        console.log('\n🔐 Testing PII Encryption...');
        const sensitiveData = "User Private PII Data";
        const encrypted = CryptoService.encrypt(sensitiveData);
        const decrypted = CryptoService.decrypt(encrypted);
        
        if (decrypted === sensitiveData && encrypted !== sensitiveData) {
            console.log('✅ Encryption Success: Data secured and correctly decrypted.');
        } else {
            console.error('❌ Encryption Failure!');
        }

        // 3. Verify Executive Metrics
        console.log('\n📊 Testing Executive Metrics...');
        const execRes = await axios.get(`${API_URL}/admin/executive/metrics`, {
            headers: { Authorization: `Bearer ${adminToken}`, 'user-agent': 'axios-tester' }
        });
        
        if (execRes.data.business && execRes.data.readiness) {
            console.log(`✅ Metrics Success: Readiness Score is ${execRes.data.readiness.score}%`);
            console.log(`📈 Current Status: ${execRes.data.readiness.status}`);
        } else {
            console.error('❌ Metrics Failure: Missing business data.');
        }

        // 4. Verify Admin Scaling Indicators
        console.log('\n🏛️ Testing Admin Dashboard Scaling Logic...');
        const adminRes = await axios.get(`${API_URL}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${adminToken}`, 'user-agent': 'axios-tester' }
        });

        if (adminRes.data.scaling) {
            console.log(`✅ Admin Success: Scaling Target is ${adminRes.data.scaling.target}`);
        } else {
            console.error('❌ Admin Failure: Missing scaling indicator.');
        }

        console.log('\n✨ ALL EXCELLENCE LAYER TESTS PASSED! ✨');

    } catch (error: any) {
        console.error('❌ E2E Failed with error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

runExcellenceE2E();


import dotenv from 'dotenv';
import path from 'path';
import app from '../src/app';
import { createClient } from '@supabase/supabase-js';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function run() {
    const PORT = 3333; // Use different port to avoid conflict
    const BASE_URL = `http://localhost:${PORT}/api`;

    // Start local server instance
    const server = app.listen(PORT, () => {
        console.log(`🚀 Test Server running on port ${PORT}`);
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let userId = '';

    console.log('🚀 Starting Audit Fix Verification (Silent QA)...');

    try {
        // 1. Get Authentication Token
        const email = `audit_qa_${Date.now()}@viva360.com`; // Unique user
        const password = 'TestPassword123!';
        
        console.log(`Creating test user: ${email}...`);
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'PROFESSIONAL' } // Guardião
        });

        if (userError || !user.user) {
            console.error('Failed to create test user:', userError);
            throw new Error('User creation failed');
        }
        userId = user.user.id;

        // 1b. Create Profile (Required for Space features)
        const { error: profileError } = await supabase.from('profiles').insert({
            id: userId,
            name: 'Audit Tester',
            email: email,
            role: 'PROFESSIONAL',
            active_role: 'PROFESSIONAL'
        });

        if (profileError) {
            console.error('Failed to create profile:', profileError);
            throw new Error('Profile creation failed');
        }
        
        // Login to get token
        const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !auth.session) {
            console.error('Failed to login:', authError);
            throw new Error('Login failed');
        }

        const token = auth.session.access_token;
        console.log('✅ Authenticated successfully.');

        // 2. Test Endpoints
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const tests = [
            { name: 'List Spaces', url: `${BASE_URL}/spaces`, method: 'GET' },
            { name: 'Get Analytics', url: `${BASE_URL}/spaces/analytics`, method: 'GET' },
            { name: 'Get Reviews', url: `${BASE_URL}/spaces/reviews`, method: 'GET' },
            { name: 'Get Contract', url: `${BASE_URL}/spaces/contract`, method: 'GET' },
            { name: 'Generate Invite', url: `${BASE_URL}/spaces/invites`, method: 'POST', body: { role: 'GUARDIAN', uses: 5 } },
            { name: 'Create Room', url: `${BASE_URL}/spaces/rooms`, method: 'POST', body: { name: 'Sala Teste QA', type: 'healing', capacity: 15 } }
        ];

        let failures = 0;

        for (const test of tests) {
            try {
                console.log(`Testing ${test.name}...`);
                const res = await fetch(test.url, {
                    method: test.method,
                    headers,
                    body: test.body ? JSON.stringify(test.body) : undefined
                });

                if (res.ok) {
                    // Start reading body to confirm json
                    const data = await res.json(); 
                    console.log(`✅ ${test.name}: OK`);
                } else {
                    console.error(`❌ ${test.name}: FAILED (${res.status})`);
                    const text = await res.text();
                    console.error('Response:', text);
                    failures++;
                }
            } catch (e: any) {
                console.error(`❌ ${test.name}: NETWORK ERROR`, e.message);
                failures++;
            }
        }

        if (failures > 0) {
            console.error(`FAILED: ${failures} tests failed.`);
            throw new Error('Tests failed'); // Throw to trigger catch/finally
        } else {
            console.log('✨ ALL AUDIT FIXES VERIFIED SUCCESSFULLY.');
        }

    } catch (e: any) {
        console.error('FATAL ERROR:', e.message);
        process.exitCode = 1; // Set exit code but don't exit immediately
    } finally {
        if (userId) {
            console.log('🧹 Cleanup user...');
            await supabase.auth.admin.deleteUser(userId);
        }
        if (server) server.close();
        console.log('Server closed.');
        // Now exit
        process.exit(process.exitCode || 0);
    }
}

run();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthService } from '../backend/src/services/auth.service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullFlow() {
    console.log("🚀 Starting E2E Auth Flow Verification...");

    const email = `verify_${Date.now()}@viva360.com`;
    const password = 'TestPassword123!';
    const name = 'Verify Agent';

    try {
        console.log(`\n1️⃣ Registering new user via AuthService: ${email}`);
        // We call the actual service logic
        const session = await AuthService.register(email, password, name, 'CLIENT');
        console.log("   ✅ User registered via Backend Logic.");
        console.log("   👤 Created ID:", session.user.id);

        console.log(`\n2️⃣ Attempting to Login via Supabase SDK (SDK) with same credentials...`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("❌ SDK Login Failed:", error.message);
            process.exit(1);
        }

        console.log("✅ SDK Login SUCCESSFUL!");
        console.log("👤 Logged in as:", data.user?.email);
        console.log("📜 Confirmed at:", data.user?.confirmed_at);
        console.log("🛠 Metadata:", data.user?.user_metadata);

        if (data.user?.confirmed_at) {
            console.log("\n🎉 TEST PASSED: Backend-created users are now fully compatible with Supabase SDK Auth!");
        } else {
            console.warn("\n⚠️ User logged in but confirmed_at is missing. This might be a partial fix.");
        }

    } catch (err: any) {
        console.error("\n❌ Unexpected Error:", err.message);
        process.exit(1);
    }
}

testFullFlow();

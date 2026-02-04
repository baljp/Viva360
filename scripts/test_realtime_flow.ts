
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Key in .env");
    process.exit(1);
}

// Create two clients to simulate two users
const clientA = createClient(supabaseUrl, supabaseKey);
const clientB = createClient(supabaseUrl, supabaseKey);

async function testLiveFlow() {
    console.log("🚀 Starting Realtime Flow Test...");
    console.log("   (Testing: Chat Exchange + Notification Delivery)");

    try {
        // 1. Authenticate / Identify
        // In a real test we might create temp users, but for "Is it working",
        // we often need real auth. 
        // LIMITATION: We can't auto-login Google.
        // We will try to sign up anonymous/temp users if allowed, or ask for credentials.
        
        console.log("\n🔒 Attempting to create Tempoary Test Users...");
        
        const emailA = `test_user_a_${Date.now()}@example.com`;
        const emailB = `test_user_b_${Date.now()}@example.com`;
        const password = 'TestPassword123!';

        // Setup User A
        const { data: authA, error: errA } = await clientA.auth.signUp({ email: emailA, password });
        if (errA) throw new Error(`User A Signup Failed: ${errA.message}`);
        console.log("   ✅ User A Created");

        // Setup User B
        const { data: authB, error: errB } = await clientB.auth.signUp({ email: emailB, password });
        if (errB) throw new Error(`User B Signup Failed: ${errB.message}`);
        console.log("   ✅ User B Created");

        const idA = authA.user!.id;
        const idB = authB.user!.id;

        // 2. Setup Realtime Listener on Client B (Receiver)
        console.log("\n📡 Setting up Realtime Listener for User B...");
        
        const received = new Promise<{msg: any, notif: any}>((resolve, reject) => {
            let chatReceived = false;
            let notifReceived = false;
            const receivedData = { msg: null, notif: null };

            const checkDone = () => {
                if(chatReceived && notifReceived) resolve(receivedData);
            };

            // Listen for Messages
            clientB
                .channel('room_test')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${idB}` }, 
                    (payload) => {
                        console.log("   📨 User B received Message via Realtime!");
                        receivedData.msg = payload.new;
                        chatReceived = true;
                        checkDone();
                    }
                )
                .subscribe();

            // Listen for Notifications
            clientB
                .channel('notif_test')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${idB}` }, 
                    (payload) => {
                         console.log("   🔔 User B received Notification via Realtime!");
                         receivedData.notif = payload.new;
                         notifReceived = true;
                         checkDone();
                    }
                )
                .subscribe();
            
            // Timeout 10s
            setTimeout(() => reject(new Error("Timeout waiting for realtime events")), 15000);
        });

        // 3. Send Message from User A
        console.log("\n📤 User A sending message to User B...");
        const { error: sendErr } = await clientA.from('chat_messages').insert({
            sender_id: idA,
            receiver_id: idB,
            content: "Hello from Automator!"
        });

        if (sendErr) throw sendErr;
        console.log("   ✅ Message Sent to DB.");

        // 4. Wait for receipt
        console.log("⏳ Waiting for Realtime delivery...");
        await received;

        console.log("\n🎉 SUCCESS! Full flow verified:");
        console.log("   1. Message inserted by A");
        console.log("   2. Message received by B (Realtime Chat works)");
        console.log("   3. Notification Trigger fired (DB Trigger works)");
        console.log("   4. Notification received by B (Realtime Notify works)");

    } catch (e: any) {
        console.error("\n❌ Test Failed:", e.message);
        console.log("NOTE: If Signup failed, Enable 'Email Auth' in Supabase Dashboard.");
    }
}

testLiveFlow();

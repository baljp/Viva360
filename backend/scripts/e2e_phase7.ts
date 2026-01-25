
import { NotificationDispatcher } from '../src/services/notification.dispatcher';

// Mock Environment if not set (though we run with SUPABASE_URL=http://mock.local)
if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = 'http://mock.local';
}

async function runPhase7() {
    console.log('🚀 Phase 7: Smart Notifications Testing Starting...');

    try {
        const userId = 'p7_user_123';

        // --- 7.1 EMAIL DISPATCH ---
        console.log('\n📧 [7.1] EMAIL CHANNEL');
        await NotificationDispatcher.dispatch({
            userId,
            title: 'Welcome to Viva360',
            message: 'Your journey begins now.',
            channels: ['EMAIL']
        });
        console.log('   ✅ Email Dispatch triggered');


        // --- 7.2 OMNICHANNEL FAN-OUT ---
        console.log('\n📣 [7.2] OMNICHANNEL FAN-OUT');
        const results = await NotificationDispatcher.dispatch({
            userId,
            title: 'Urgent Alert',
            message: 'Your appointment is in 1 hour.',
            channels: ['PUSH', 'WHATSAPP', 'IN_APP']
        });
        
        const successCount = results.filter((r: any) => r.status === 'sent').length;
        console.log(`   ✅ Fan-out Results: ${successCount}/3 channels sent`);
        results.forEach((r: any) => console.log(`      - [${r.channel}] ${r.status}`));


    } catch (e: any) {
        console.error('❌ PHASE 7 FAILED', e);
        process.exit(1);
    }
}

runPhase7();

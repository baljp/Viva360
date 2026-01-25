
import { emailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { pushService } from './push.service';
import prisma from '../lib/prisma'; // Assuming we save in-app notifications to DB

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'PUSH' | 'IN_APP';

export interface NotificationPayload {
    userId: string;
    title: string;
    message: string;
    channels: NotificationChannel[];
    metadata?: any;
}

export class NotificationDispatcher {
    
    static async dispatch(payload: NotificationPayload) {
        if (process.env.SUPABASE_URL?.includes('mock')) {
            console.log(`\n📢 [MOCK DISPATCHER] Notify User: ${payload.userId}`);
        } else {
            console.log(`\n📢 [DISPATCHER] Notify User: ${payload.userId}`);
        }

        const results = await Promise.all(payload.channels.map(async (channel) => {
            // Mock Preferences Check
            // In a real scenario, this would check a 'UserPreferences' table
            if (payload.userId === 'user-no-email' && channel === 'EMAIL') {
                console.log('   🚫 [PREFS] Blocked EMAIL for user-no-email');
                return { channel, status: 'skipped', reason: 'User Preference' };
            }

            try {
                switch (channel) {
                    case 'EMAIL':
                        // Fetch user email from ID
                        const userEmail = await NotificationDispatcher.getUserEmail(payload.userId); 
                        if (userEmail) {
                            await emailService.send({
                                to: userEmail,
                                subject: payload.title,
                                template: 'NOTIFICATION',
                                context: { body: payload.message }
                            });
                        }
                        break;
                    
                    case 'WHATSAPP':
                         // Fetch user phone from Profile
                         // Mocking phone for now
                         await whatsappService.send({
                             to: '5511999999999', // Mock
                             text: `*${payload.title}*\n${payload.message}`
                         });
                         break;

                    case 'PUSH':
                        // Fetch user push subscriptions from DB
                        // Mock subscription
                        await pushService.sendNotification(
                            { endpoint: 'https://fcm.googleapis.com/...', keys: { p256dh: '...', auth: '...' } }, 
                            JSON.stringify({ title: payload.title, body: payload.message })
                        );
                        break;

                    case 'IN_APP':
                        // Save to Database
                        // await prisma.notification.create(...)
                        console.log(`   📝 [IN_APP] Saved to database: ${payload.title}`);
                        break;
                }
                return { channel, status: 'sent' };
            } catch (error) {
                console.error(`   ❌ Failed to send ${channel}`, error);
                return { channel, status: 'failed', error };
            }
        }));

        return results;
    }

    private static async getUserEmail(userId: string): Promise<string | null> {
        if (userId === 'mock-user') return 'mock@test.com';
        
        // Mock DB lookup
        if (process.env.SUPABASE_URL?.includes('mock')) {
             return `user_${userId}@viva360.com`;
        }

        // Real DB lookup
        try {
            const user = await prisma.profile.findUnique({ where: { id: userId }});
             return user?.email || null;
        } catch {
            return null;
        }
    }
}

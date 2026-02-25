
import { emailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { pushService } from './push.service';
import prisma from '../lib/prisma'; // Assuming we save in-app notifications to DB
import { logger } from '../lib/logger';
import { isMockMode } from './supabase.service';

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'PUSH' | 'IN_APP';

export interface NotificationPayload {
    userId: string;
    title: string;
    message: string;
    channels: NotificationChannel[];
    metadata?: unknown;
}

export class NotificationDispatcher {
    
    static async dispatch(payload: NotificationPayload) {
        if (isMockMode()) {
            logger.info('notification.dispatch', { userId: payload.userId, mode: 'test' });
        } else {
            logger.info('notification.dispatch', { userId: payload.userId, mode: 'real' });
        }

        const results = await Promise.all(payload.channels.map(async (channel) => {
            // TODO: check UserPreferences table
            if (payload.userId === 'user-no-email' && channel === 'EMAIL') {
                logger.info('notification.preference_blocked', { userId: payload.userId, channel });
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
                         // TODO: fetch user phone from Profile
                         await whatsappService.send({
                             to: '5511999999999', // placeholder
                             text: `*${payload.title}*\n${payload.message}`
                         });
                         break;

                    case 'PUSH':
                        // Fetch user push subscriptions from DB
                        // TODO: fetch push subscription from DB
                        await pushService.sendNotification(
                            { endpoint: 'https://fcm.googleapis.com/...', keys: { p256dh: '...', auth: '...' } }, 
                            JSON.stringify({ title: payload.title, body: payload.message })
                        );
                        break;

                    case 'IN_APP':
                        // Save to Database
                        // await prisma.notification.create(...)
                        logger.info('notification.in_app_saved', { userId: payload.userId, title: payload.title });
                        break;
                }
                return { channel, status: 'sent' };
            } catch (error) {
                logger.error('notification.send_failed', { channel, userId: payload.userId, error });
                return { channel, status: 'failed', error };
            }
        }));

        return results;
    }

    private static async getUserEmail(userId: string): Promise<string | null> {
        if (isMockMode()) {
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

import prisma from '../lib/prisma';
import { isMockMode } from './supabase.service';

// For Notifications, given its simplicity, we might merge Repo logic here for now
// or keep it strictly separated. Let's start with Service encapsulating Prisma.

export class NotificationService {
    async list(userId: string) {
        if (isMockMode()) {
            return [
              { id: 'n1', title: 'Bem-vindo', message: 'Eco-sistema Viva360', timestamp: new Date().toISOString() }
            ];
        }

        return await prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { timestamp: 'desc' }
        });
    }

    async sendPushSimulation(userId: string, title: string, message: string) {
        const { notificationQueue } = await import('../lib/queue');
        
        // 1. Store in DB (Sync for immediate history view)
        await prisma.notification.create({
            data: {
              user_id: userId,
              title,
              message,
              type: 'push_sim',
            }
        });

        // 2. Offload External Integration to Queue
        try {
            await notificationQueue.add('send_push', { userId, title, message });
        } catch (e) {
            console.error(`❌ [NOTIF] queue failed:`, e);
        }
    }

    async markAsRead(userId: string, notificationId: string) {
        if (isMockMode()) {
            return { success: true };
        }

        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                user_id: userId,
            },
            data: {
                read: true,
            },
        });

        return { success: true };
    }

    async markAllAsRead(userId: string) {
        if (isMockMode()) {
            return { success: true };
        }

        await prisma.notification.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true },
        });
        return { success: true };
    }
}

export const notificationService = new NotificationService();

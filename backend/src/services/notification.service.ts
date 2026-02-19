import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export class NotificationService {
    async list(userId: string) {
        return await prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { timestamp: 'desc' }
        });
    }

    async sendPushSimulation(userId: string, title: string, message: string) {
        const { notificationQueue } = await import('../lib/queue');
        
        await prisma.notification.create({
            data: {
              user_id: userId,
              title,
              message,
              type: 'push_sim',
            }
        });

        try {
            await notificationQueue.add('send_push', { userId, title, message });
        } catch (e) {
            logger.warn('notification.queue_failed', e);
        }
    }

    async markAsRead(userId: string, notificationId: string) {
        await prisma.notification.updateMany({
            where: { id: notificationId, user_id: userId },
            data: { read: true },
        });
        return { success: true };
    }

    async markAllAsRead(userId: string) {
        await prisma.notification.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true },
        });
        return { success: true };
    }
}

export const notificationService = new NotificationService();

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
        if (isMockMode()) {
             console.log(`[MOCK PUSH] To: ${userId} | "${title}: ${message}"`);
             return;
        }

        // 1. Store in DB
        await prisma.notification.create({
            data: {
              user_id: userId,
              title,
              message,
              type: 'push_sim',
            }
        });

        // 2. Simulate Push
        console.log(`[MOBILE PUSH] To: ${userId} | "${title}: ${message}"`);
    }
}

export const notificationService = new NotificationService();

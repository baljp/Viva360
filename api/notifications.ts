import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../src/lib/prisma';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    const { userId, notificationId } = request.query;

    if (!userId) {
        return response.status(400).json({ error: 'User ID required' });
    }

    try {
        if (request.method === 'GET') {
            const notifications = await prisma.notification.findMany({
                where: { userId: String(userId) },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
            return response.status(200).json(notifications);
        }

        if (request.method === 'PATCH') {
            if (!notificationId) {
                // Mark all as read
                await prisma.notification.updateMany({
                    where: { userId: String(userId), read: false },
                    data: { read: true },
                });
                return response.status(200).json({ success: true });
            }

            const updated = await prisma.notification.update({
                where: { id: String(notificationId) },
                data: { read: true },
            });
            return response.status(200).json(updated);
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Notifications error:', error);
        return response.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

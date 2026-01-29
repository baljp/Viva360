import { chatRepository } from '../repositories/chat.repository';
import { sendPushSimulation } from '../controllers/notifications.controller'; // Note: Ideally this should also be a service
import { isMockMode } from './supabase.service';

export class ChatService {
    async sendMessage(senderId: string, receiverId: string, content: string) {
        if (isMockMode()) {
            return {
                id: 'mock-msg-' + Date.now(),
                sender_id: senderId || 'mock-sender',
                receiver_id: receiverId,
                content,
                created_at: new Date().toISOString()
            };
        }

        const msg = await chatRepository.create({ senderId, receiverId, content });

        // Domain Logic: Send Notification
        // In a real event-driven system, this would emit an event.
        await sendPushSimulation(receiverId, 'New Message', `User ${senderId} sent a message.`);

        return msg;
    }

    async getHistory(userId: string, otherUserId: string) {
        if (!otherUserId) throw new Error('Missing otherUserId');

        if (isMockMode()) {
            return [
                { id: 'm1', sender_id: otherUserId, receiver_id: userId, content: 'Olá! Como posso ajudar?', created_at: new Date(Date.now() - 10000).toISOString() },
                { id: 'm2', sender_id: userId, receiver_id: otherUserId, content: 'Gostaria de agendar uma sessão.', created_at: new Date().toISOString() }
            ];
        }

        return await chatRepository.getHistory(userId, otherUserId);
    }
}

export const chatService = new ChatService();

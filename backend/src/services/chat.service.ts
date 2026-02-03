import { chatRepository } from '../repositories/chat.repository';
import { sendPushSimulation } from '../controllers/notifications.controller'; // Note: Ideally this should also be a service

export class ChatService {
    async sendMessage(senderId: string, receiverId: string, content: string) {

        const msg = await chatRepository.create({ senderId, receiverId, content });

        // Domain Logic: Send Notification
        // In a real event-driven system, this would emit an event.
        await sendPushSimulation(receiverId, 'New Message', `User ${senderId} sent a message.`);

        return msg;
    }

    async getHistory(userId: string, otherUserId: string) {
        if (!otherUserId) throw new Error('Missing otherUserId');


        return await chatRepository.getHistory(userId, otherUserId);
    }
}

export const chatService = new ChatService();

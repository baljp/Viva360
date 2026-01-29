import prisma from '../lib/prisma';

export interface CreateMessageData {
    senderId: string;
    receiverId: string;
    content: string;
}

export interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: Date;
}

export class ChatRepository {
    async create(data: CreateMessageData): Promise<ChatMessage> {
        return await prisma.chatMessage.create({
            data: {
                sender_id: data.senderId,
                receiver_id: data.receiverId,
                content: data.content,
            }
        });
    }

    async getHistory(userId: string, otherUserId: string): Promise<ChatMessage[]> {
        return await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { sender_id: userId, receiver_id: otherUserId },
                    { sender_id: otherUserId, receiver_id: userId }
                ]
            },
            orderBy: { created_at: 'asc' }
        });
    }
}

export const chatRepository = new ChatRepository();

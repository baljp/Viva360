"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = exports.ChatRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class ChatRepository {
    async create(data) {
        return await prisma_1.default.chatMessage.create({
            data: {
                sender_id: data.senderId,
                receiver_id: data.receiverId,
                content: data.content,
            }
        });
    }
    async getHistory(userId, otherUserId) {
        return await prisma_1.default.chatMessage.findMany({
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
exports.ChatRepository = ChatRepository;
exports.chatRepository = new ChatRepository();

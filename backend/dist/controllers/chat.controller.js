"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = exports.sendMessage = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notifications_controller_1 = require("./notifications.controller");
const sendMessage = async (req, res) => {
    const senderId = req.user?.userId;
    const { receiverId, content } = req.body;
    const msg = await prisma_1.default.chatMessage.create({
        data: {
            sender_id: senderId,
            receiver_id: receiverId,
            content,
        }
    });
    // Notify Receiver
    await (0, notifications_controller_1.sendPushSimulation)(receiverId, 'New Message', `User ${senderId} sent a message.`);
    return res.json(msg);
};
exports.sendMessage = sendMessage;
const getHistory = async (req, res) => {
    const userId = req.user?.userId;
    const { otherUserId } = req.query;
    if (typeof otherUserId !== 'string')
        return res.status(400).json({ error: 'Missing otherUserId' });
    const messages = await prisma_1.default.chatMessage.findMany({
        where: {
            OR: [
                { sender_id: userId, receiver_id: otherUserId },
                { sender_id: otherUserId, receiver_id: userId }
            ]
        },
        orderBy: { created_at: 'asc' }
    });
    return res.json(messages);
};
exports.getHistory = getHistory;

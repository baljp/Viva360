"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRoomMessage = exports.getRoomMessages = exports.listRooms = exports.getHistory = exports.sendMessage = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const chat_service_1 = require("../services/chat.service");
exports.sendMessage = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const senderId = req.user?.userId;
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
        return res.status(400).json({ error: 'receiverId and content are required' });
    }
    const chat = await chat_service_1.chatService.getOrCreateChat(senderId, receiverId);
    const msg = await chat_service_1.chatService.sendMessage(chat.id, senderId, content);
    return res.json(msg);
});
exports.getHistory = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { otherUserId } = req.query;
    if (typeof otherUserId !== 'string')
        return res.status(400).json({ error: 'Missing otherUserId' });
    // Backward compatibility: resolve/create private room and return history
    const chat = await chat_service_1.chatService.getOrCreateChat(userId, otherUserId);
    const messages = await chat_service_1.chatService.getChatHistory(chat.id);
    return res.json(messages);
});
exports.listRooms = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const rooms = await chat_service_1.chatService.getChatsForProfile(userId);
    return res.json(rooms);
});
exports.getRoomMessages = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { roomId } = req.params;
    const messages = await chat_service_1.chatService.getChatHistory(roomId);
    return res.json(messages);
});
exports.sendRoomMessage = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const senderId = req.user?.userId;
    const { roomId } = req.params;
    const { content } = req.body;
    if (!content)
        return res.status(400).json({ error: 'content is required' });
    const message = await chat_service_1.chatService.sendMessage(roomId, senderId, content);
    return res.json(message);
});

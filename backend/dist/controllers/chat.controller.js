"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = exports.sendMessage = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const chat_service_1 = require("../services/chat.service");
exports.sendMessage = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const senderId = req.user?.userId;
    const { receiverId, content } = req.body;
    const msg = await chat_service_1.chatService.sendMessage(senderId, receiverId, content);
    return res.json(msg);
});
exports.getHistory = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { otherUserId } = req.query;
    if (typeof otherUserId !== 'string')
        return res.status(400).json({ error: 'Missing otherUserId' });
    // Support both old direct messages and new chat rooms
    // For backwards compatibility, we create/find a chat between the two users
    const messages = await chat_service_1.chatService.getChatHistory(otherUserId);
    return res.json(messages);
});

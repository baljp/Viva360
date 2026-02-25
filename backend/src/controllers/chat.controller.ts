import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';
import { chatService } from '../services/chat.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';

const chatLimitSchema = z.coerce.number().int().min(1).max(100).optional();
const sendMessageSchema = z.object({
  receiverId: z.string().min(1).max(128),
  content: z.string().min(1).max(4000),
});
const sendRoomMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});
const historyQuerySchema = z.object({
  otherUserId: z.string().min(1).max(128),
  limit: chatLimitSchema,
});
const listRoomsQuerySchema = z.object({
  contextType: z.string().max(64).optional(),
  contextId: z.string().max(128).optional(),
  limit: chatLimitSchema,
});
const roomParamsSchema = z.object({
  roomId: z.string().min(1).max(128),
});
const roomMessagesQuerySchema = z.object({
  limit: chatLimitSchema,
});
const joinRoomSchema = z.object({
  type: z.enum(['support_room', 'healing_circle']),
  contextId: z.string().max(128).optional(),
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?.userId;
  const { receiverId, content } = sendMessageSchema.parse(req.body || {});
  const chat = await chatService.getOrCreateChat(senderId, receiverId);
  const msg = await chatService.sendMessage(chat.id, senderId, content);
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'CHAT',
    entityId: chat.id,
    action: 'SEND_MESSAGE',
    actorId: senderId,
    status: 'COMPLETED',
    nextStep: 'AWAIT_REPLY',
    requestId: req.requestId,
    payload: {
      messageId: msg.id,
      receiverId,
    },
  });
  
  return res.json({
    ...msg,
    actionReceipt,
  });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { otherUserId, limit } = historyQuerySchema.parse(req.query || {});

  // Backward compatibility: resolve/create private room and return history
  const chat = await chatService.getOrCreateChat(userId, otherUserId);
  const messages = await chatService.getChatHistory(chat.id, limit ?? 50);

  return res.json(messages);
});

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { contextType = '', contextId = '', limit } = listRoomsQuerySchema.parse(req.query || {});
  const rooms = await chatService.getChatsForProfile(userId, {
    contextType,
    contextId,
    limit: limit ?? 50,
  });
  return res.json(rooms);
});

export const getRoomMessages = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = roomParamsSchema.parse(req.params || {});
  const { limit } = roomMessagesQuerySchema.parse(req.query || {});
  const messages = await chatService.getChatHistory(roomId, limit ?? 50);
  return res.json(messages);
});

export const sendRoomMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?.userId;
  const { roomId } = roomParamsSchema.parse(req.params || {});
  const { content } = sendRoomMessageSchema.parse(req.body || {});
  const message = await chatService.sendMessage(roomId, senderId, content);
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'CHAT',
    entityId: roomId,
    action: 'SEND_MESSAGE',
    actorId: senderId,
    status: 'COMPLETED',
    nextStep: 'AWAIT_REPLY',
    requestId: req.requestId,
    payload: {
      messageId: message.id,
    },
  });
  return res.json({
    ...message,
    actionReceipt,
  });
});

export const joinRoom = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { type, contextId } = joinRoomSchema.parse(req.body || {});

  const chat = await chatService.getOrCreateContextRoom(userId, type, contextId);
  return res.json({ chat });
});

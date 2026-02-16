import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { chatService } from '../services/chat.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = (req as any).user?.userId;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: 'receiverId and content are required' });
  }
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
  const userId = (req as any).user?.userId;
  const { otherUserId } = req.query;

  if (typeof otherUserId !== 'string') return res.status(400).json({error: 'Missing otherUserId'});

  // Backward compatibility: resolve/create private room and return history
  const chat = await chatService.getOrCreateChat(userId, otherUserId);
  const messages = await chatService.getChatHistory(chat.id);

  return res.json(messages);
});

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const contextType = typeof req.query.contextType === 'string' ? req.query.contextType : '';
  const contextId = typeof req.query.contextId === 'string' ? req.query.contextId : '';
  const rooms = await chatService.getChatsForProfile(userId, {
    contextType,
    contextId,
  });
  return res.json(rooms);
});

export const getRoomMessages = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const messages = await chatService.getChatHistory(roomId);
  return res.json(messages);
});

export const sendRoomMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = (req as any).user?.userId;
  const { roomId } = req.params;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'content is required' });
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
  const userId = (req as any).user?.userId;
  const { type, contextId } = req.body || {};

  const safeType = String(type || '').trim();
  if (!safeType) return res.status(400).json({ error: 'type is required' });

  // Restrict to known group-room types to avoid creating arbitrary rooms via API.
  if (!['support_room', 'healing_circle'].includes(safeType)) {
    return res.status(400).json({ error: 'unsupported room type' });
  }

  const chat = await chatService.getOrCreateContextRoom(userId, safeType, contextId);
  return res.json({ chat });
});

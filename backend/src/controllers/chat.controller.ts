import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { chatService } from '../services/chat.service';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = (req as any).user?.userId;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: 'receiverId and content are required' });
  }
  const chat = await chatService.getOrCreateChat(senderId, receiverId);
  const msg = await chatService.sendMessage(chat.id, senderId, content);
  
  return res.json(msg);
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
  const rooms = await chatService.getChatsForProfile(userId);
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
  return res.json(message);
});

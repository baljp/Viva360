import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { chatService } from '../services/chat.service';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = (req as any).user?.userId;
  const { receiverId, content } = req.body;

  const msg = await chatService.sendMessage(senderId, receiverId, content);
  
  return res.json(msg);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { otherUserId } = req.query;

  if (typeof otherUserId !== 'string') return res.status(400).json({error: 'Missing otherUserId'});

  // Support both old direct messages and new chat rooms
  // For backwards compatibility, we create/find a chat between the two users
  const messages = await chatService.getChatHistory(otherUserId);

  return res.json(messages);
});

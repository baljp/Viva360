import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendPushSimulation } from './notifications.controller';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = (req as any).user?.userId;
  const { receiverId, content } = req.body;

  if (isMockMode()) {
    return res.json({
        id: 'mock-msg-' + Date.now(),
        sender_id: senderId || 'mock-sender',
        receiver_id: receiverId,
        content,
        created_at: new Date().toISOString()
    });
  }

  const msg = await prisma.chatMessage.create({
    data: {
      sender_id: senderId,
      receiver_id: receiverId,
      content,
    }
  });

  // Notify Receiver
  await sendPushSimulation(receiverId, 'New Message', `User ${senderId} sent a message.`);

  return res.json(msg);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { otherUserId } = req.query;

  if (typeof otherUserId !== 'string') return res.status(400).json({error: 'Missing otherUserId'});

  if (isMockMode()) {
    return res.json([
        { id: 'm1', sender_id: otherUserId, receiver_id: userId, content: 'Olá! Como posso ajudar?', created_at: new Date(Date.now() - 10000).toISOString() },
        { id: 'm2', sender_id: userId, receiver_id: otherUserId, content: 'Gostaria de agendar uma sessão.', created_at: new Date().toISOString() }
    ]);
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { sender_id: userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: userId }
      ]
    },
    orderBy: { created_at: 'asc' }
  });

  return res.json(messages);
});

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendPushSimulation } from './notifications.controller';

export const sendMessage = async (req: Request, res: Response) => {
  const senderId = (req as any).user?.userId;
  const { receiverId, content } = req.body;

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
};

export const getHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { otherUserId } = req.query;

  if (typeof otherUserId !== 'string') return res.status(400).json({error: 'Missing otherUserId'});

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
};

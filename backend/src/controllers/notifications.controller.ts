import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';

export const list = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  if (isMockMode()) {
    return res.json([
      { id: 'n1', title: 'Bem-vindo', message: 'Eco-sistema Viva360', timestamp: new Date().toISOString() }
    ]);
  }

  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { timestamp: 'desc' }
  });
  return res.json(notifications);
};

export const sendPushSimulation = async (userId: string, title: string, message: string) => {
  if (isMockMode()) {
     console.log(`[MOCK PUSH] To: ${userId} | "${title}: ${message}"`);
     return;
  }

  // 1. Store in DB
  await prisma.notification.create({
    data: {
      user_id: userId,
      title,
      message,
      type: 'push_sim',
    }
  });

  // 2. Simulate Push (Log to console as "Mobile Push Service")
  console.log(`[MOBILE PUSH] To: ${userId} | "${title}: ${message}"`);
  
  // Future: Integraiton with Expo/FCM would go here
};

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendPushSimulation } from './notifications.controller';

export const processPayment = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { amount, description, receiverId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check Sender Balance
      const sender = await tx.profile.findUnique({ where: { id: userId } });
      if (!sender || sender.personal_balance.toNumber() < amount) {
        throw new Error('Insufficient funds');
      }

      // 2. Debit Sender
      await tx.profile.update({
        where: { id: userId },
        data: { 
          personal_balance: { decrement: amount },
          karma: { increment: amount * 2 } // Gamification hook
        }
      });

      // 3. Credit Receiver (if any)
      if (receiverId) {
        await tx.profile.update({
          where: { id: receiverId },
          data: { personal_balance: { increment: amount } }
        });
        
        // Notify Receiver
        await sendPushSimulation(receiverId, 'Payment Received', `You received ${amount} coins.`);
      }

      // 4. Create Transaction Record
      return await tx.transaction.create({
        data: {
          user_id: userId,
          type: 'expense',
          amount: amount,
          description: description || 'Checkout Payment',
        }
      });
    });

    // Notify Sender
    await sendPushSimulation(userId, 'Payment Successful', `Spent ${amount} coins.`);

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

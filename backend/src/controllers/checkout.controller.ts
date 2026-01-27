import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendPushSimulation } from './notifications.controller';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';

export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { amount, description, receiverId, items } = req.body; // items: [{ id, price, type }]

    if (isMockMode()) {
       // Simulate Cart Checkout
       const total = items ? items.reduce((acc: number, item: any) => acc + item.price, 0) : amount;
       
       // UPGRADE: 9.2 Inventory Logic
       if (items) {
           console.log(`   📉 [INVENTORY] Deducting stock for ${items.length} items...`);
           items.forEach((i: any) => console.log(`      - Item ${i.id}: Stock -1`));
       }

       return res.json({
         id: 'mock-tx-cart-id',
         user_id: userId || 'mock-sender',
         type: 'expense',
         amount: total,
         description: description || `Checkout (${items?.length || 1} items)`,
         items: items || [],
         status: 'completed',
         fulfillment: items?.map((i: any) => ({ itemId: i.id, status: 'fulfilled', type: i.type })) || [],
         created_at: new Date().toISOString()
       });
    }

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
});

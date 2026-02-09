import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendPushSimulation } from './notifications.controller';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';

export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { amount, description, receiverId, items, contextType } = req.body; // items: [{ id, price, type }]
  const normalizedAmount = Number(amount || 0);

    if (isMockMode()) {
       // Simulate Cart Checkout
       const total = items ? items.reduce((acc: number, item: any) => acc + Number(item.price || 0), 0) : normalizedAmount;
       
       // UPGRADE: 9.2 Inventory Logic
       if (items) {
           console.log(`   📉 [INVENTORY] Deducting stock for ${items.length} items...`);
           items.forEach((i: any) => console.log(`      - Item ${i.id}: Stock -1`));
       }

       const mockResult = {
         id: 'mock-tx-cart-id',
         user_id: userId || 'mock-sender',
         type: 'expense',
         amount: total,
         description: description || `Checkout (${items?.length || 1} items)`,
         items: items || [],
         status: 'completed',
         fulfillment: items?.map((i: any) => ({ itemId: i.id, status: 'fulfilled', type: i.type })) || [],
         created_at: new Date().toISOString(),
       };

       const confirmation = await interactionService.emitCheckoutConfirmation({
        buyerId: String(userId || 'mock-sender'),
        receiverId: receiverId ? String(receiverId) : undefined,
        amount: total,
        contextType: String(contextType || ''),
        entityId: String(mockResult.id),
        description: String(description || 'Checkout em modo teste'),
       });

       return res.json({
        status: 'COMPLETED',
        code: 'CHECKOUT_CONFIRMED',
        transaction: mockResult,
        confirmation,
       });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check Sender Balance
      const sender = await tx.profile.findUnique({ where: { id: userId } });
      if (!sender || sender.personal_balance.toNumber() < normalizedAmount) {
        throw new Error('Insufficient funds');
      }

      // 2. Debit Sender
      await tx.profile.update({
        where: { id: userId },
        data: { 
          personal_balance: { decrement: normalizedAmount },
          karma: { increment: normalizedAmount * 2 } // Gamification hook
        }
      });

      // 3. Credit Receiver (if any)
      if (receiverId) {
        await tx.profile.update({
          where: { id: receiverId },
          data: { personal_balance: { increment: normalizedAmount } }
        });
        // Debiting and Crediting done in transaction
      }

      // 4. Create Transaction Record
      return await tx.transaction.create({
        data: {
          user_id: userId,
          type: 'expense',
          amount: normalizedAmount,
          description: description || 'Checkout Payment',
        }
      });
    });

    // 5. Post-Commit Actions (Notifications)
    if (receiverId) {
      // Notify Receiver (Async/Fire-and-forget or awaited outside tx)
      await sendPushSimulation(receiverId, 'Payment Received', `You received ${normalizedAmount} coins.`);
    }

    // Notify Sender
    await sendPushSimulation(userId, 'Payment Successful', `Spent ${normalizedAmount} coins.`);

    let confirmation: any = null;
    try {
      confirmation = await interactionService.emitCheckoutConfirmation({
        buyerId: String(userId),
        receiverId: receiverId ? String(receiverId) : undefined,
        amount: normalizedAmount,
        contextType: String(contextType || ''),
        entityId: String(result.id),
        description: String(description || 'Checkout Payment'),
      });
    } catch (error) {
      interactionService.logInteractionFailure('checkout.confirmation', error, { requestId: req.requestId, userId });
    }

    return res.json({
      status: 'COMPLETED',
      code: 'CHECKOUT_CONFIRMED',
      transaction: result,
      confirmation,
    });
});

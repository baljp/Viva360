import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendPushSimulation } from './notifications.controller';
import { isMockMode, supabaseAdmin } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';

const resolveContextType = (value?: string) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'BAZAR') return 'BAZAR';
  if (normalized === 'TRIBO') return 'TRIBO';
  if (normalized === 'RECRUTAMENTO') return 'RECRUTAMENTO';
  if (normalized === 'ESCAMBO') return 'ESCAMBO';
  if (normalized === 'AGENDA') return 'AGENDA';
  return 'GERAL';
};

const ensureContext = (contextType: string, contextRef?: string | null) => {
  if (contextType !== 'BAZAR' && contextType !== 'GERAL' && !String(contextRef || '').trim()) {
    const error: any = new Error('contextRef é obrigatório para este tipo de checkout.');
    error.statusCode = 400;
    throw error;
  }
};

const applyContextWorkflow = async (params: {
  contextType: string;
  contextRef?: string | null;
  buyerId: string;
  receiverId?: string | null;
  amount: number;
  description?: string | null;
}) => {
  const contextRef = String(params.contextRef || '').trim();
  if (!contextRef) {
    return { contextAction: 'NO_CONTEXT_REFERENCE', nextStep: 'NONE' };
  }

  if (isMockMode()) {
    if (params.contextType === 'BAZAR') return { contextAction: 'MARKETPLACE_ORDER_COMPLETED', nextStep: 'NONE' };
    if (params.contextType === 'TRIBO') return { contextAction: 'TRIBE_INVITE_ACCEPTED', nextStep: 'ONBOARD_TRIBE' };
    if (params.contextType === 'RECRUTAMENTO') return { contextAction: 'RECRUITMENT_APPLICATION_UPDATED', nextStep: 'ONBOARDING' };
    if (params.contextType === 'ESCAMBO') return { contextAction: 'ESCAMBO_COMPLETED', nextStep: 'NONE' };
    if (params.contextType === 'AGENDA') return { contextAction: 'APPOINTMENT_CONFIRMED', nextStep: 'ATTEND_APPOINTMENT' };
    return { contextAction: 'GENERIC_CHECKOUT', nextStep: 'NONE' };
  }

  if (params.contextType === 'BAZAR') {
    const product = await prisma.product.findUnique({ where: { id: contextRef } });
    if (product) {
      await prisma.marketplaceOrder.create({
        data: {
          buyer_id: params.buyerId,
          seller_id: product.owner_id || params.buyerId,
          product_id: product.id,
          quantity: 1,
          total_price: params.amount,
          status: 'completed',
          payment_status: 'PAID',
          fulfillment_status: product.type === 'physical' ? 'PENDING' : 'COMPLETED',
          completed_at: new Date(),
        },
      });
      return { contextAction: 'MARKETPLACE_ORDER_COMPLETED', nextStep: product.type === 'physical' ? 'FULFILLMENT_PENDING' : 'NONE' };
    }
    return { contextAction: 'PRODUCT_NOT_FOUND', nextStep: 'SUPPORT_REVIEW' };
  }

  if (params.contextType === 'TRIBO') {
    const invite = await prisma.tribeInvite.findUnique({ where: { id: contextRef } });
    if (invite) {
      await prisma.tribeInvite.update({
        where: { id: invite.id },
        data: {
          status: 'accepted',
          responded_at: new Date(),
        },
      });
      return { contextAction: 'TRIBE_INVITE_ACCEPTED', nextStep: 'ONBOARD_TRIBE' };
    }
    return { contextAction: 'TRIBE_INVITE_NOT_FOUND', nextStep: 'SUPPORT_REVIEW' };
  }

  if (params.contextType === 'RECRUTAMENTO') {
    const application = await prisma.recruitmentApplication.findUnique({ where: { id: contextRef } });
    if (application) {
      await prisma.recruitmentApplication.update({
        where: { id: application.id },
        data: {
          status: application.status === 'INTERVIEW_ACCEPTED' ? 'HIRED' : 'INTERVIEW_ACCEPTED',
        },
      });
      return { contextAction: 'RECRUITMENT_APPLICATION_UPDATED', nextStep: 'ONBOARDING' };
    }
    return { contextAction: 'RECRUITMENT_APPLICATION_NOT_FOUND', nextStep: 'SUPPORT_REVIEW' };
  }

  if (params.contextType === 'ESCAMBO') {
    const offer = await prisma.swapOffer.findUnique({ where: { id: contextRef } });
    if (offer) {
      await prisma.swapOffer.update({
        where: { id: offer.id },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });
      return { contextAction: 'ESCAMBO_COMPLETED', nextStep: 'NONE' };
    }
    return { contextAction: 'ESCAMBO_NOT_FOUND', nextStep: 'SUPPORT_REVIEW' };
  }

  if (params.contextType === 'AGENDA') {
    const { error } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', contextRef);

    if (error) {
      return { contextAction: 'APPOINTMENT_UPDATE_FAILED', nextStep: 'SUPPORT_REVIEW' };
    }
    return { contextAction: 'APPOINTMENT_CONFIRMED', nextStep: 'ATTEND_APPOINTMENT' };
  }

  return { contextAction: 'GENERIC_CHECKOUT', nextStep: 'NONE' };
};

const runCheckout = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { amount, description, receiverId, items, contextType, contextRef } = req.body; // items: [{ id, price, type }]
  const normalizedAmount = Number(amount || 0);
  const normalizedContext = resolveContextType(contextType);
  ensureContext(normalizedContext, contextRef);

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

       const contextResult = await applyContextWorkflow({
        contextType: normalizedContext,
        contextRef: contextRef || null,
        buyerId: String(userId || 'mock-sender'),
        receiverId: receiverId ? String(receiverId) : null,
        amount: total,
        description: String(description || ''),
       });

       const confirmation = await interactionService.emitCheckoutConfirmation({
        buyerId: String(userId || 'mock-sender'),
        receiverId: receiverId ? String(receiverId) : undefined,
        amount: total,
        contextType: normalizedContext,
        entityId: String(mockResult.id),
        description: String(description || 'Checkout em modo teste'),
       });

       const actionReceipt = await interactionReceiptService.upsert({
        entityType: 'CHECKOUT',
        entityId: String(mockResult.id),
        action: 'PAY',
        actorId: String(userId),
        status: 'COMPLETED',
        nextStep: 'NONE',
        requestId: req.requestId,
        payload: {
          confirmationId: confirmation.confirmationId,
          contextType: normalizedContext,
          contextRef: contextRef || null,
          notified: confirmation.sentTo || [],
          contextAction: contextResult.contextAction,
        },
       });

       return res.json({
        status: 'COMPLETED',
        code: 'CHECKOUT_CONFIRMED',
        transaction: mockResult,
        confirmation,
        confirmationId: confirmation.confirmationId,
        counterpartiesNotified: confirmation.sentTo || [],
        contextAction: contextResult.contextAction,
        actionReceipt,
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

    const contextResult = await applyContextWorkflow({
      contextType: normalizedContext,
      contextRef: contextRef || null,
      buyerId: String(userId),
      receiverId: receiverId ? String(receiverId) : null,
      amount: normalizedAmount,
      description: String(description || ''),
    });

    let confirmation: any = null;
    try {
      confirmation = await interactionService.emitCheckoutConfirmation({
        buyerId: String(userId),
        receiverId: receiverId ? String(receiverId) : undefined,
        amount: normalizedAmount,
        contextType: normalizedContext,
        entityId: String(result.id),
        description: String(description || 'Checkout Payment'),
      });
    } catch (error) {
      interactionService.logInteractionFailure('checkout.confirmation', error, { requestId: req.requestId, userId });
    }

    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'CHECKOUT',
      entityId: String(result.id),
      action: 'PAY',
      actorId: String(userId),
      status: 'COMPLETED',
      nextStep: 'NONE',
      requestId: req.requestId,
        payload: {
        confirmationId: confirmation?.confirmationId || null,
        contextType: normalizedContext,
        contextRef: contextRef || null,
        notified: confirmation?.sentTo || [],
        contextAction: contextResult.contextAction,
      },
    });

    return res.json({
      status: 'COMPLETED',
      code: 'CHECKOUT_CONFIRMED',
      transaction: result,
      confirmation,
      confirmationId: confirmation?.confirmationId || null,
      counterpartiesNotified: confirmation?.sentTo || [],
      contextAction: contextResult.contextAction,
      actionReceipt,
    });
};

export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  return runCheckout(req, res);
});

export const processContextualCheckout = asyncHandler(async (req: Request, res: Response) => {
  return runCheckout(req, res);
});

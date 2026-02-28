import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { notificationEngine } from '../services/notificationEngine.service';
import { supabaseAdmin } from '../services/supabase.service';
import { isMockMode, mockCheckoutResult, CheckoutItem } from '../services/mockAdapter';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';
import { mockAdapter } from '../services/mockAdapter';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


type CheckoutConfirmation = {
  confirmationId?: string | null;
  sentTo?: string[];
  context?: string | null;
};

type AppointmentLookup = {
  id?: string;
  professional_id?: string | null;
};

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
    throw new AppError('contextRef é obrigatório para este tipo de checkout.', 400, 'CONTEXT_REF_REQUIRED');
  }
};

const ensureContextualContract = (contextType: string, contextRef?: string | null) => {
  if (contextType === 'GERAL') {
    throw new AppError('contextType é obrigatório no checkout contextual.', 400, 'CONTEXT_TYPE_REQUIRED');
  }
  if (!String(contextRef || '').trim()) {
    throw new AppError('contextRef é obrigatório no checkout contextual.', 400, 'CONTEXT_REF_REQUIRED');
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

const buildCheckoutResponse = (params: {
  requestId?: string;
  transaction: unknown;
  confirmationId?: string | null;
  counterpartiesNotified?: string[];
  contextAction: string;
  contextLabel?: string;
  actionReceipt: unknown;
}) => ({
  status: 'COMPLETED',
  code: 'CHECKOUT_CONFIRMED',
  message: 'Checkout contextual confirmado com sucesso.',
  requestId: params.requestId || null,
  timestamp: new Date().toISOString(),
  transaction: params.transaction,
  confirmationId: params.confirmationId || null,
  counterpartiesNotified: params.counterpartiesNotified || [],
  confirmation: {
    confirmationId: params.confirmationId || null,
    sentTo: params.counterpartiesNotified || [],
    context: params.contextLabel || null,
  },
  contextAction: params.contextAction,
  actionReceipt: params.actionReceipt,
});

const runCheckout = async (req: Request, res: Response, options?: { strictContextual?: boolean }) => {
  const userId = req.user?.userId;
  const { amount, description, receiverId, items, contextType, contextRef } = req.body as {
    amount?: number | string;
    description?: string;
    receiverId?: string;
    items?: CheckoutItem[];
    contextType?: string;
    contextRef?: string;
  }; // items: [{ id, price, type }]
  const normalizedAmount = Number(amount || 0);
  const normalizedContext = resolveContextType(contextType);
  if (options?.strictContextual) {
    ensureContextualContract(normalizedContext, contextRef);
  }
  ensureContext(normalizedContext, contextRef);
  let resolvedReceiverId = String(receiverId || '').trim() || null;
  const extraRecipients = new Set<string>();

  if (!resolvedReceiverId && normalizedContext === 'BAZAR' && contextRef) {
    const product = await prisma.product.findUnique({
      where: { id: String(contextRef) },
      select: { owner_id: true },
    }).catch(() => null);
    if (product?.owner_id) {
      resolvedReceiverId = String(product.owner_id);
    }
  }

  if (normalizedContext === 'AGENDA' && contextRef) {
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id,professional_id')
      .eq('id', String(contextRef))
      .single();

    const professionalId = String((appointment as AppointmentLookup | null)?.professional_id || '').trim();
    if (!resolvedReceiverId && professionalId) {
      resolvedReceiverId = professionalId;
    }

    if (UUID_REGEX.test(professionalId)) {
      const professional = await prisma.profile.findUnique({
        where: { id: professionalId },
        select: { hub_id: true },
      }).catch(() => null);
      if (professional?.hub_id) {
        extraRecipients.add(String(professional.hub_id));
      }
    }
  }

  if (isMockMode()) {
    const total = items ? items.reduce((acc: number, item: CheckoutItem) => acc + Number(item.price || 0), 0) : normalizedAmount;
    if (items) {
      logger.info('inventory.deduct_mock', {
        count: Array.isArray(items) ? items.length : 0,
        items: Array.isArray(items) ? items.map((i: CheckoutItem) => ({ id: i?.id })) : [],
      });
    }
    const mockResult = mockCheckoutResult({ userId, amount: total, description, items });

    // Persist a real transaction record even in mock mode if possible, to satisfy E2E tests
    try {
      await prisma.transaction.create({
        data: {
          user_id: String(userId),
          type: 'expense',
          amount: total,
          description: description || 'Mock Checkout Payment (E2E)',
        }
      });
    } catch (e) {
      logger.warn('checkout.mock_persistence_failed', e);
    }

    const contextResult = await applyContextWorkflow({
      contextType: normalizedContext,
      contextRef: contextRef || null,
      buyerId: String(userId || ''),
      receiverId: resolvedReceiverId ? String(resolvedReceiverId) : null,
      amount: total,
      description: String(description || ''),
    });

    const confirmation = await interactionService.emitCheckoutConfirmation({
      buyerId: String(userId || 'mock-sender'),
      receiverId: resolvedReceiverId ? String(resolvedReceiverId) : undefined,
      extraRecipients: Array.from(extraRecipients),
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

    return res.json(buildCheckoutResponse({
      requestId: req.requestId,
      transaction: mockResult,
      confirmationId: confirmation.confirmationId,
      counterpartiesNotified: confirmation.sentTo || [],
      contextAction: contextResult.contextAction,
      contextLabel: confirmation.context,
      actionReceipt,
    }));
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
    if (resolvedReceiverId) {
      await tx.profile.update({
        where: { id: resolvedReceiverId },
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
  if (resolvedReceiverId) {
    await notificationEngine.emit({
      type: 'payment.received',
      actorId: String(userId),
      targetUserId: String(resolvedReceiverId),
      entityType: 'transaction',
      entityId: String(userId),
      data: { amount: normalizedAmount },
    });
  }

  await notificationEngine.emit({
    type: 'checkout.confirmed',
    actorId: String(userId),
    targetUserId: String(userId),
    entityType: 'transaction',
    entityId: String(userId),
    data: { context: normalizedContext, confirmationId: null },
  });

  const contextResult = await applyContextWorkflow({
    contextType: normalizedContext,
    contextRef: contextRef || null,
    buyerId: String(userId),
    receiverId: resolvedReceiverId ? String(resolvedReceiverId) : null,
    amount: normalizedAmount,
    description: String(description || ''),
  });

  let confirmation: CheckoutConfirmation | null = null;
  try {
    confirmation = await interactionService.emitCheckoutConfirmation({
      buyerId: String(userId),
      receiverId: resolvedReceiverId ? String(resolvedReceiverId) : undefined,
      extraRecipients: Array.from(extraRecipients),
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

  return res.json(buildCheckoutResponse({
    requestId: req.requestId,
    transaction: result,
    confirmationId: confirmation?.confirmationId || null,
    counterpartiesNotified: confirmation?.sentTo || [],
    contextAction: contextResult.contextAction,
    contextLabel: confirmation?.context || null,
    actionReceipt,
  }));
};

export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  return runCheckout(req, res, { strictContextual: false });
});

export const processContextualCheckout = asyncHandler(async (req: Request, res: Response) => {
  return runCheckout(req, res, { strictContextual: true });
});

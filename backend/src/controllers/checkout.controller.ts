import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { notificationEngine } from '../services/notificationEngine.service';
import { supabaseAdmin } from '../services/supabase.service';
import { isMockMode, mockCheckoutResult, CheckoutItem, saveMockFinanceTransaction } from '../services/mockAdapter';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';
import { paymentProviderService, type CheckoutProviderMethod } from '../services/paymentProvider.service';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

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

type CheckoutMetadata = {
  transactionId?: string | null;
  receiverId?: string | null;
  contextType?: string | null;
  contextRef?: string | null;
  extraRecipients?: string[];
  paymentMethod?: CheckoutProviderMethod;
  confirmationId?: string | null;
  confirmation?: CheckoutConfirmation | null;
  contextAction?: string | null;
  actionReceiptId?: string | null;
  finalizedAt?: string | null;
  providerSessionUrl?: string | null;
};

type CheckoutBody = {
  amount?: number | string;
  description?: string;
  receiverId?: string;
  paymentMethod?: string;
  items?: CheckoutItem[];
  contextType?: string;
  contextRef?: string;
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

const resolvePaymentMethod = (value?: string): CheckoutProviderMethod => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'pix') return 'pix';
  if (normalized === 'direct') return 'direct';
  return 'card';
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

const asMetadata = (value: unknown): CheckoutMetadata => {
  if (!value || typeof value !== 'object') return {};
  return value as CheckoutMetadata;
};

const isProviderBackedMethod = (method: CheckoutProviderMethod) => method === 'card' || method === 'pix';

const buildFrontendOrigin = () => {
  const candidates = [
    process.env.FRONTEND_URL,
    process.env.VITE_SUPABASE_AUTH_REDIRECT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];
  const resolved = candidates.find((value) => String(value || '').trim());
  return String(resolved || 'https://viva360.vercel.app').replace(/\/$/, '');
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

const buildProviderPendingResponse = (params: {
  requestId?: string;
  transaction: unknown;
  provider: string;
  method: CheckoutProviderMethod;
  providerRef: string;
  url?: string | null;
  providerStatus?: string;
}) => ({
  status: 'PENDING_PROVIDER_ACTION',
  code: 'CHECKOUT_PROVIDER_PENDING',
  message: 'Aguardando confirmação do provedor de pagamento.',
  requestId: params.requestId || null,
  timestamp: new Date().toISOString(),
  transaction: params.transaction,
  providerAction: {
    provider: params.provider,
    method: params.method,
    providerRef: params.providerRef,
    url: params.url || null,
    providerStatus: params.providerStatus || 'pending',
  },
});

const finalizeProviderTransaction = async (params: {
  transactionId: string;
  userId: string;
  requestId?: string;
}) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.transactionId },
  });

  if (!transaction) {
    throw new AppError('Transação não encontrada.', 404, 'CHECKOUT_TRANSACTION_NOT_FOUND');
  }
  if (String(transaction.user_id) !== params.userId) {
    throw new AppError('Acesso negado à transação.', 403, 'CHECKOUT_TRANSACTION_FORBIDDEN');
  }

  const metadata = asMetadata(transaction.metadata);
  if (String(transaction.status || '').toLowerCase() === 'completed') {
    const actionReceipt = metadata.actionReceiptId
      ? await prisma.interactionReceipt.findUnique({ where: { id: metadata.actionReceiptId } }).catch(() => null)
      : null;
    return buildCheckoutResponse({
      requestId: params.requestId,
      transaction,
      confirmationId: metadata.confirmationId || null,
      counterpartiesNotified: metadata.confirmation?.sentTo || [],
      contextAction: metadata.contextAction || 'GENERIC_CHECKOUT',
      contextLabel: metadata.confirmation?.context || null,
      actionReceipt,
    });
  }

  const amount = Number(transaction.amount || 0);
  const receiverId = String(metadata.receiverId || '').trim() || null;
  const contextType = resolveContextType(metadata.contextType || undefined);
  const contextRef = String(metadata.contextRef || '').trim() || null;
  const extraRecipients = Array.isArray(metadata.extraRecipients)
    ? metadata.extraRecipients.map((entry) => String(entry)).filter(Boolean)
    : [];

  const updatedTransaction = await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: params.userId },
      data: {
        karma: { increment: amount * 2 },
      },
    });

    if (receiverId && UUID_REGEX.test(receiverId)) {
      await tx.profile.update({
        where: { id: receiverId },
        data: { personal_balance: { increment: amount } },
      });
    }

    return tx.transaction.update({
      where: { id: params.transactionId },
      data: {
        status: 'completed',
        provider_status: 'paid',
      },
    });
  });

  if (receiverId && UUID_REGEX.test(receiverId)) {
    await notificationEngine.emit({
      type: 'payment.received',
      actorId: params.userId,
      targetUserId: receiverId,
      entityType: 'transaction',
      entityId: params.transactionId,
      data: { amount },
    });
  }

  await notificationEngine.emit({
    type: 'checkout.confirmed',
    actorId: params.userId,
    targetUserId: params.userId,
    entityType: 'transaction',
    entityId: params.transactionId,
    data: { context: contextType, confirmationId: null },
  });

  const contextResult = await applyContextWorkflow({
    contextType,
    contextRef,
    buyerId: params.userId,
    receiverId,
    amount,
    description: updatedTransaction.description || 'Checkout via provedor',
  });

  let confirmation: CheckoutConfirmation | null = null;
  try {
    confirmation = await interactionService.emitCheckoutConfirmation({
      buyerId: params.userId,
      receiverId: receiverId || undefined,
      extraRecipients,
      amount,
      contextType,
      entityId: params.transactionId,
      description: updatedTransaction.description || 'Checkout via provedor',
    });
  } catch (error) {
    interactionService.logInteractionFailure('checkout.provider.confirmation', error, { requestId: params.requestId, userId: params.userId });
  }

  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'CHECKOUT',
    entityId: params.transactionId,
    action: 'PAY',
    actorId: params.userId,
    status: 'COMPLETED',
    nextStep: 'NONE',
    requestId: params.requestId,
    payload: {
      confirmationId: confirmation?.confirmationId || null,
      contextType,
      contextRef,
      notified: confirmation?.sentTo || [],
      contextAction: contextResult.contextAction,
      provider: updatedTransaction.provider || 'stripe',
    },
  });

  const nextMetadata: CheckoutMetadata = {
    ...metadata,
    confirmationId: confirmation?.confirmationId || null,
    confirmation,
    contextAction: contextResult.contextAction,
    actionReceiptId: actionReceipt.id,
    finalizedAt: new Date().toISOString(),
  };

  await prisma.transaction.update({
    where: { id: params.transactionId },
    data: { metadata: nextMetadata },
  }).catch(() => undefined);

  return buildCheckoutResponse({
    requestId: params.requestId,
    transaction: updatedTransaction,
    confirmationId: confirmation?.confirmationId || null,
    counterpartiesNotified: confirmation?.sentTo || [],
    contextAction: contextResult.contextAction,
    contextLabel: confirmation?.context || null,
    actionReceipt,
  });
};

const runCheckout = async (req: Request, res: Response, options?: { strictContextual?: boolean }) => {
  const userId = String(req.user?.userId || '').trim();
  const { amount, description, receiverId, items, contextType, contextRef, paymentMethod } = req.body as CheckoutBody;
  const normalizedAmount = Number(amount || 0);
  const normalizedContext = resolveContextType(contextType);
  const normalizedMethod = resolvePaymentMethod(paymentMethod);

  if (!userId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
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
        select: { hub_id: true, email: true },
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

    try {
      await prisma.transaction.create({
        data: {
          user_id: userId,
          type: 'expense',
          amount: total,
          description: description || 'Mock Checkout Payment (E2E)',
          provider: 'internal_wallet',
          provider_status: 'completed',
          context_type: normalizedContext,
          context_ref: contextRef || null,
          metadata: {
            receiverId: resolvedReceiverId,
            extraRecipients: Array.from(extraRecipients),
            paymentMethod: normalizedMethod,
          },
        },
      });
    } catch (e) {
      logger.warn('checkout.mock_persistence_failed', e);
      saveMockFinanceTransaction({
        id: String(mockResult.id),
        user_id: String(userId || 'mock-sender'),
        type: 'expense',
        amount: Number(total || 0),
        description: String(description || 'Mock Checkout Payment (E2E)'),
        status: 'completed',
        date: new Date().toISOString(),
      });
    }

    const contextResult = await applyContextWorkflow({
      contextType: normalizedContext,
      contextRef: contextRef || null,
      buyerId: userId,
      receiverId: resolvedReceiverId ? String(resolvedReceiverId) : null,
      amount: total,
      description: String(description || ''),
    });

    const confirmation = await interactionService.emitCheckoutConfirmation({
      buyerId: userId,
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
      actorId: userId,
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

  if (isProviderBackedMethod(normalizedMethod) && !paymentProviderService.isStripeConfigured()) {
    throw new AppError('O provedor real de pagamento não está configurado para este ambiente.', 503, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
  }

  if (isProviderBackedMethod(normalizedMethod) && paymentProviderService.isStripeConfigured()) {
    const frontendOrigin = buildFrontendOrigin();
    const pendingTransaction = await prisma.transaction.create({
      data: {
        user_id: userId,
        type: 'expense',
        amount: normalizedAmount,
        description: description || 'Checkout Payment',
        status: 'pending',
        provider: 'stripe',
        provider_status: 'pending',
        context_type: normalizedContext,
        context_ref: contextRef || null,
        metadata: {
          receiverId: resolvedReceiverId,
          contextType: normalizedContext,
          contextRef: contextRef || null,
          extraRecipients: Array.from(extraRecipients),
          paymentMethod: normalizedMethod,
        },
      },
    });

    try {
      const buyerProfile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { email: true },
      }).catch(() => null);

      const session = await paymentProviderService.createHostedCheckout({
        transactionId: pendingTransaction.id,
        amount: normalizedAmount,
        description: description || 'Checkout Payment',
        method: normalizedMethod,
        successUrl: `${frontendOrigin}/checkout/success?transactionId=${encodeURIComponent(pendingTransaction.id)}`,
        cancelUrl: `${frontendOrigin}/checkout/cancel?transactionId=${encodeURIComponent(pendingTransaction.id)}`,
        customerEmail: buyerProfile?.email || null,
        metadata: {
          userId,
          contextType: normalizedContext,
          contextRef: String(contextRef || ''),
        },
      });

      const updated = await prisma.transaction.update({
        where: { id: pendingTransaction.id },
        data: {
          provider_ref: session.providerRef,
          metadata: {
            ...(asMetadata(pendingTransaction.metadata)),
            providerSessionUrl: session.url,
          },
        },
      });

      return res.json(buildProviderPendingResponse({
        requestId: req.requestId,
        transaction: updated,
        provider: session.provider,
        method: normalizedMethod,
        providerRef: session.providerRef,
        url: session.url,
        providerStatus: session.paymentStatus,
      }));
    } catch (error) {
      await prisma.transaction.update({
        where: { id: pendingTransaction.id },
        data: {
          status: 'failed',
          provider_status: 'failed',
        },
      }).catch(() => undefined);
      throw error;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const sender = await tx.profile.findUnique({ where: { id: userId } });
    if (!sender || sender.personal_balance.toNumber() < normalizedAmount) {
      throw new AppError('Saldo insuficiente para concluir o checkout.', 400, 'INSUFFICIENT_FUNDS');
    }

    await tx.profile.update({
      where: { id: userId },
      data: {
        personal_balance: { decrement: normalizedAmount },
        karma: { increment: normalizedAmount * 2 },
      },
    });

    if (resolvedReceiverId) {
      await tx.profile.update({
        where: { id: resolvedReceiverId },
        data: { personal_balance: { increment: normalizedAmount } },
      });
    }

    return tx.transaction.create({
      data: {
        user_id: userId,
        type: 'expense',
        amount: normalizedAmount,
        description: description || 'Checkout Payment',
        provider: 'internal_wallet',
        provider_status: 'completed',
        context_type: normalizedContext,
        context_ref: contextRef || null,
        metadata: {
          receiverId: resolvedReceiverId,
          contextType: normalizedContext,
          contextRef: contextRef || null,
          extraRecipients: Array.from(extraRecipients),
          paymentMethod: normalizedMethod,
        },
      },
    });
  });

  if (resolvedReceiverId) {
    await notificationEngine.emit({
      type: 'payment.received',
      actorId: userId,
      targetUserId: String(resolvedReceiverId),
      entityType: 'transaction',
      entityId: String(result.id),
      data: { amount: normalizedAmount },
    });
  }

  await notificationEngine.emit({
    type: 'checkout.confirmed',
    actorId: userId,
    targetUserId: userId,
    entityType: 'transaction',
    entityId: String(result.id),
    data: { context: normalizedContext, confirmationId: null },
  });

  const contextResult = await applyContextWorkflow({
    contextType: normalizedContext,
    contextRef: contextRef || null,
    buyerId: userId,
    receiverId: resolvedReceiverId ? String(resolvedReceiverId) : null,
    amount: normalizedAmount,
    description: String(description || ''),
  });

  let confirmation: CheckoutConfirmation | null = null;
  try {
    confirmation = await interactionService.emitCheckoutConfirmation({
      buyerId: userId,
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
    actorId: userId,
    status: 'COMPLETED',
    nextStep: 'NONE',
    requestId: req.requestId,
    payload: {
      confirmationId: confirmation?.confirmationId || null,
      contextType: normalizedContext,
      contextRef: contextRef || null,
      notified: confirmation?.sentTo || [],
      contextAction: contextResult.contextAction,
      provider: 'internal_wallet',
    },
  });

  await prisma.transaction.update({
    where: { id: result.id },
    data: {
      metadata: {
        receiverId: resolvedReceiverId,
        contextType: normalizedContext,
        contextRef: contextRef || null,
        extraRecipients: Array.from(extraRecipients),
        paymentMethod: normalizedMethod,
        confirmationId: confirmation?.confirmationId || null,
        confirmation,
        contextAction: contextResult.contextAction,
        actionReceiptId: actionReceipt.id,
        finalizedAt: new Date().toISOString(),
      },
    },
  }).catch(() => undefined);

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

export const getTransactionStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  const transactionId = String(req.params.transactionId || '').trim();
  if (!transactionId) {
    throw new AppError('transactionId é obrigatório.', 400, 'CHECKOUT_TRANSACTION_ID_REQUIRED');
  }
  if (isMockMode() && transactionId.startsWith('mock-tx-')) {
    return res.json({
      status: 'COMPLETED',
      code: 'CHECKOUT_CONFIRMED',
      message: 'Checkout mock confirmado para ambiente de teste.',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      transaction: {
        id: transactionId,
        user_id: userId,
        status: 'completed',
        provider: 'internal_wallet',
        provider_status: 'completed',
      },
      confirmation: {
        confirmationId: null,
        sentTo: [userId],
        context: null,
      },
      contextAction: 'GENERIC_CHECKOUT',
      actionReceipt: null,
    });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new AppError('Transação não encontrada.', 404, 'CHECKOUT_TRANSACTION_NOT_FOUND');
  }
  if (String(transaction.user_id) !== userId) {
    throw new AppError('Acesso negado à transação.', 403, 'CHECKOUT_TRANSACTION_FORBIDDEN');
  }

  if (String(transaction.provider || '') === 'stripe' && transaction.provider_ref && String(transaction.status || '').toLowerCase() !== 'completed') {
    const providerStatus = await paymentProviderService.getHostedCheckoutStatus(String(transaction.provider_ref));

    if (providerStatus.paymentStatus === 'paid') {
      const finalized = await finalizeProviderTransaction({
        transactionId,
        userId,
        requestId: req.requestId,
      });
      return res.json(finalized);
    }

    if (providerStatus.status === 'expired') {
      const failed = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'failed',
          provider_status: 'expired',
        },
      });
      return res.json({
        status: 'FAILED',
        code: 'CHECKOUT_PROVIDER_EXPIRED',
        message: 'A sessão do provedor expirou.',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        transaction: failed,
      });
    }

    return res.json(buildProviderPendingResponse({
      requestId: req.requestId,
      transaction,
      provider: providerStatus.provider,
      method: resolvePaymentMethod(asMetadata(transaction.metadata).paymentMethod),
      providerRef: providerStatus.providerRef,
      url: providerStatus.url,
      providerStatus: providerStatus.paymentStatus,
    }));
  }

  const metadata = asMetadata(transaction.metadata);
  if (String(transaction.status || '').toLowerCase() === 'completed') {
    const actionReceipt = metadata.actionReceiptId
      ? await prisma.interactionReceipt.findUnique({ where: { id: metadata.actionReceiptId } }).catch(() => null)
      : null;
    return res.json(buildCheckoutResponse({
      requestId: req.requestId,
      transaction,
      confirmationId: metadata.confirmationId || null,
      counterpartiesNotified: metadata.confirmation?.sentTo || [],
      contextAction: metadata.contextAction || 'GENERIC_CHECKOUT',
      contextLabel: metadata.confirmation?.context || null,
      actionReceipt,
    }));
  }

  return res.json({
    status: String(transaction.status || 'pending').toUpperCase(),
    code: 'CHECKOUT_STATUS',
    message: 'Transação ainda em processamento.',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    transaction,
  });
});

export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signatureHeader = String(req.headers['stripe-signature'] || '').trim();
  const rawBody = String((req as Request & { rawBody?: string }).rawBody || '');

  if (!signatureHeader || !rawBody) {
    throw new AppError('Webhook do provedor sem assinatura válida.', 400, 'STRIPE_WEBHOOK_BAD_REQUEST');
  }

  paymentProviderService.verifyStripeWebhookSignature(rawBody, signatureHeader);

  const event = (typeof req.body === 'object' && req.body)
    ? (req.body as Record<string, unknown>)
    : JSON.parse(rawBody) as Record<string, unknown>;

  const eventType = String(event.type || '').trim();
  const eventObject = event.data && typeof event.data === 'object'
    ? (((event.data as Record<string, unknown>).object as Record<string, unknown> | undefined) || null)
    : null;
  const metadata = asMetadata(eventObject?.metadata);
  const transactionId = String(metadata.transactionId || '').trim();

  if (!transactionId) {
    return res.json({ received: true, ignored: true });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  }).catch(() => null);

  if (!transaction) {
    return res.json({ received: true, ignored: true });
  }

  if (eventType === 'checkout.session.completed' || eventType === 'checkout.session.async_payment_succeeded') {
    if (String(transaction.status || '').toLowerCase() !== 'completed') {
      await finalizeProviderTransaction({
        transactionId,
        userId: String(transaction.user_id),
        requestId: req.requestId,
      });
    }
    return res.json({ received: true, status: 'completed' });
  }

  if (eventType === 'checkout.session.expired' || eventType === 'checkout.session.async_payment_failed' || eventType === 'payment_intent.payment_failed') {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'failed',
        provider_status: eventType === 'checkout.session.expired' ? 'expired' : 'failed',
      },
    }).catch(() => undefined);
    return res.json({ received: true, status: 'failed' });
  }

  return res.json({ received: true, ignored: true });
});

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';
import { z } from 'zod';
import { isMockMode } from '../services/supabase.service';
import { mockAdapter, type MockSwapOffer } from '../services/mockAdapter';

const counterSchema = z.object({
  counterOffer: z.string().min(3).max(500),
});

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const providerId = (req as any).user?.userId;
  const { requesterId, description } = req.body;

  if (isMockMode()) {
    const offer = mockAdapter.alchemy.createOffer({
      providerId: String(providerId || 'mock-provider'),
      requesterId: String(requesterId || 'mock-requester'),
      description: String(description || ''),
    });
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: offer.id, action: 'CREATE',
      actorId: offer.provider_id, status: 'COMPLETED', nextStep: 'AWAIT_RECEIVER_RESPONSE',
      requestId: req.requestId, payload: { requesterId: offer.requester_id, description: offer.description || null },
    });
    return res.status(201).json({ ...offer, code: 'ESCAMBO_CREATED', actionReceipt });
  }

  const offer = await prisma.swapOffer.create({
    data: {
      provider_id: providerId,
      requester_id: requesterId,
      description,
      status: 'pending'
    }
  });

  try {
    await interactionService.emitEscamboOffer({
      providerId, requesterId, offerId: offer.id, description,
    });
  } catch (error) {
    interactionService.logInteractionFailure('escambo.create', error, {
      requestId: req.requestId, providerId, requesterId,
    });
  }

  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'CREATE',
    actorId: providerId, status: 'COMPLETED', nextStep: 'AWAIT_RECEIVER_RESPONSE',
    requestId: req.requestId,
    payload: { requesterId, description: description || null },
  });

  return res.status(201).json({ ...offer, code: 'ESCAMBO_CREATED', actionReceipt });
});

export const listOffers = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (isMockMode()) {
    const offers = mockAdapter.alchemy.listOffers().filter(
      (offer) => offer.provider_id === userId || offer.requester_id === userId || String((req as any).user?.role || '').toUpperCase() === 'ADMIN'
    );
    return res.json(offers);
  }
  const offers = await prisma.swapOffer.findMany({
    where: { OR: [{ provider_id: userId }, { requester_id: userId }] }
  });
  return res.json(offers);
});

const resolveOfferActor = async (offerId: string, actorId: string) => {
  if (isMockMode()) {
    const offer = mockAdapter.alchemy.getOffer(offerId);
    if (!offer) return { offer: null, counterpartId: '' };
    if (offer.provider_id !== actorId && offer.requester_id !== actorId && actorId) {
      const error = new Error('Sem permissão para esta proposta.') as Error & { statusCode?: number };
      error.statusCode = 403;
      throw error;
    }
    return {
      offer,
      counterpartId: offer.provider_id === actorId ? offer.requester_id : offer.provider_id,
    };
  }
  const offer = await prisma.swapOffer.findUnique({ where: { id: offerId } });
  if (!offer) return { offer: null, counterpartId: '' };
  if (offer.provider_id !== actorId && offer.requester_id !== actorId) {
    const error = new Error('Sem permissão para esta proposta.') as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }
  return {
    offer,
    counterpartId: offer.provider_id === actorId ? offer.requester_id : offer.provider_id,
  };
};

export const acceptOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String((req as any).user?.userId || '').trim();
  const offerId = String(req.params.id || '').trim();
  const { offer, counterpartId } = await resolveOfferActor(offerId, actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const mockOffer = offer as MockSwapOffer;
    const updated = {
      ...mockOffer,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    };
    mockAdapter.alchemy.saveOffer(updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'ACCEPT', actorId,
      status: 'COMPLETED', nextStep: 'COMPLETE_ESCAMBO', requestId: req.requestId,
      payload: { counterpartId },
    });
    return res.json({ code: 'ESCAMBO_ACCEPTED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({
    where: { id: offer.id },
    data: { status: 'accepted', accepted_at: new Date() },
  });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'accepted' });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'ACCEPT', actorId,
    status: 'COMPLETED', nextStep: 'COMPLETE_ESCAMBO', requestId: req.requestId,
    payload: { counterpartId },
  });
  return res.json({ code: 'ESCAMBO_ACCEPTED', offer: updated, actionReceipt });
});

export const rejectOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String((req as any).user?.userId || '').trim();
  const offerId = String(req.params.id || '').trim();
  const { offer, counterpartId } = await resolveOfferActor(offerId, actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const mockOffer = offer as MockSwapOffer;
    const updated = { ...mockOffer, status: 'rejected' };
    mockAdapter.alchemy.saveOffer(updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'REJECT', actorId,
      status: 'COMPLETED', nextStep: 'CLOSED', requestId: req.requestId,
      payload: { counterpartId },
    });
    return res.json({ code: 'ESCAMBO_REJECTED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({
    where: { id: offer.id },
    data: { status: 'rejected' },
  });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'rejected' });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'REJECT', actorId,
    status: 'COMPLETED', nextStep: 'CLOSED', requestId: req.requestId,
    payload: { counterpartId },
  });
  return res.json({ code: 'ESCAMBO_REJECTED', offer: updated, actionReceipt });
});

export const counterOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String((req as any).user?.userId || '').trim();
  const offerId = String(req.params.id || '').trim();
  const { counterOffer: counterOfferText } = counterSchema.parse(req.body || {});
  const { offer, counterpartId } = await resolveOfferActor(offerId, actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const mockOffer = offer as MockSwapOffer;
    const updated = { ...mockOffer, status: 'countered', counter_offer: counterOfferText };
    mockAdapter.alchemy.saveOffer(updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'COUNTER', actorId,
      status: 'COMPLETED', nextStep: 'AWAIT_COUNTERPART_RESPONSE', requestId: req.requestId,
      payload: { counterpartId, counterOffer: counterOfferText },
    });
    return res.json({ code: 'ESCAMBO_COUNTERED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({
    where: { id: offer.id },
    data: { status: 'countered', counter_offer: counterOfferText },
  });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'countered', counterOffer: counterOfferText });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'COUNTER', actorId,
    status: 'COMPLETED', nextStep: 'AWAIT_COUNTERPART_RESPONSE', requestId: req.requestId,
    payload: { counterpartId, counterOffer: counterOfferText },
  });
  return res.json({ code: 'ESCAMBO_COUNTERED', offer: updated, actionReceipt });
});

export const completeOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String((req as any).user?.userId || '').trim();
  const offerId = String(req.params.id || '').trim();
  const { offer, counterpartId } = await resolveOfferActor(offerId, actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const mockOffer = offer as MockSwapOffer;
    const updated = { ...mockOffer, status: 'completed', completed_at: new Date().toISOString() };
    mockAdapter.alchemy.saveOffer(updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'COMPLETE', actorId,
      status: 'COMPLETED', nextStep: 'NONE', requestId: req.requestId,
      payload: { counterpartId },
    });
    return res.json({ code: 'ESCAMBO_COMPLETED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({
    where: { id: offer.id },
    data: { status: 'completed', completed_at: new Date() },
  });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'completed' });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'COMPLETE', actorId,
    status: 'COMPLETED', nextStep: 'NONE', requestId: req.requestId,
    payload: { counterpartId },
  });
  return res.json({ code: 'ESCAMBO_COMPLETED', offer: updated, actionReceipt });
});

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';
import { z } from 'zod';
import { isMockMode } from '../services/supabase.service';
import { mockAdapter, makeMockSwapOffer } from '../services/mockAdapter';

const counterSchema = z.object({
  counterOffer: z.string().min(3).max(500),
});

const resolveOfferActor = async (offerId: string, actorId: string) => {
  if (isMockMode()) {
    const offer = mockAdapter.alchemy.offers.get(offerId) ?? null;
    if (!offer) return { offer: null, counterpartId: '' };
    if (offer.provider_id !== actorId && offer.requester_id !== actorId && actorId) {
      throw Object.assign(new Error('Sem permissão para esta proposta.'), { statusCode: 403 });
    }
    return { offer, counterpartId: offer.provider_id === actorId ? offer.requester_id : offer.provider_id };
  }
  const offer = await prisma.swapOffer.findUnique({ where: { id: offerId } });
  if (!offer) return { offer: null, counterpartId: '' };
  if (offer.provider_id !== actorId && offer.requester_id !== actorId) {
    throw Object.assign(new Error('Sem permissão para esta proposta.'), { statusCode: 403 });
  }
  return { offer, counterpartId: offer.provider_id === actorId ? offer.requester_id : offer.provider_id };
};

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const providerId = req.user?.userId;
  const { requesterId, description } = req.body as { requesterId?: string; description?: string };

  if (isMockMode()) {
    const offer = makeMockSwapOffer({
      provider_id: String(providerId || 'mock-provider'),
      requester_id: String(requesterId || 'mock-requester'),
      description: String(description || ''),
    });
    mockAdapter.alchemy.offers.set(offer.id, offer);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: offer.id, action: 'CREATE', actorId: offer.provider_id,
      status: 'COMPLETED', nextStep: 'AWAIT_RECEIVER_RESPONSE', requestId: req.requestId,
      payload: { requesterId: offer.requester_id, description: offer.description || null },
    });
    return res.status(201).json({ ...offer, code: 'ESCAMBO_CREATED', actionReceipt });
  }

  const offer = await prisma.swapOffer.create({ data: { provider_id: providerId, requester_id: requesterId, description, status: 'pending' } });
  try {
    await interactionService.emitEscamboOffer({ providerId, requesterId, offerId: offer.id, description });
  } catch (error) {
    interactionService.logInteractionFailure('escambo.create', error, { requestId: req.requestId, providerId, requesterId });
  }
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'CREATE', actorId: providerId,
    status: 'COMPLETED', nextStep: 'AWAIT_RECEIVER_RESPONSE', requestId: req.requestId,
    payload: { requesterId, description: description || null },
  });
  return res.status(201).json({ ...offer, code: 'ESCAMBO_CREATED', actionReceipt });
});

export const listOffers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (isMockMode()) {
    const isAdmin = String(req.user?.role || '').toUpperCase() === 'ADMIN';
    const offers = Array.from(mockAdapter.alchemy.offers.values()).filter(
      (o) => isAdmin || o.provider_id === userId || o.requester_id === userId,
    );
    return res.json(offers);
  }
  const offers = await prisma.swapOffer.findMany({ where: { OR: [{ provider_id: userId }, { requester_id: userId }] } });
  return res.json(offers);
});

export const acceptOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String(req.user?.userId || '').trim();
  const { offer, counterpartId } = await resolveOfferActor(String(req.params.id || ''), actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const updated = { ...offer, status: 'accepted', accepted_at: new Date().toISOString() };
    mockAdapter.alchemy.offers.set(updated.id, updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'ACCEPT', actorId,
      status: 'COMPLETED', nextStep: 'COMPLETE_ESCAMBO', requestId: req.requestId, payload: { counterpartId },
    });
    return res.json({ code: 'ESCAMBO_ACCEPTED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({ where: { id: offer.id }, data: { status: 'accepted', accepted_at: new Date() } });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'accepted' });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'ACCEPT', actorId,
    status: 'COMPLETED', nextStep: 'COMPLETE_ESCAMBO', requestId: req.requestId, payload: { counterpartId },
  });
  return res.json({ code: 'ESCAMBO_ACCEPTED', offer: updated, actionReceipt });
});

export const rejectOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String(req.user?.userId || '').trim();
  const { offer, counterpartId } = await resolveOfferActor(String(req.params.id || ''), actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const updated = { ...offer, status: 'rejected' };
    mockAdapter.alchemy.offers.set(updated.id, updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'REJECT', actorId,
      status: 'COMPLETED', nextStep: 'CLOSED', requestId: req.requestId, payload: { counterpartId },
    });
    return res.json({ code: 'ESCAMBO_REJECTED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({ where: { id: offer.id }, data: { status: 'rejected' } });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'rejected' });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'REJECT', actorId,
    status: 'COMPLETED', nextStep: 'CLOSED', requestId: req.requestId, payload: { counterpartId },
  });
  return res.json({ code: 'ESCAMBO_REJECTED', offer: updated, actionReceipt });
});

export const counterOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String(req.user?.userId || '').trim();
  const { counterOffer: counterOfferText } = counterSchema.parse(req.body || {});
  const { offer, counterpartId } = await resolveOfferActor(String(req.params.id || ''), actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const updated = { ...offer, status: 'countered', counter_offer: counterOfferText };
    mockAdapter.alchemy.offers.set(updated.id, updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'COUNTER', actorId,
      status: 'COMPLETED', nextStep: 'AWAIT_COUNTERPART_RESPONSE', requestId: req.requestId,
      payload: { counterpartId, counterOffer: counterOfferText },
    });
    return res.json({ code: 'ESCAMBO_COUNTERED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({ where: { id: offer.id }, data: { status: 'countered', counter_offer: counterOfferText } });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'countered', counterOffer: counterOfferText });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'COUNTER', actorId,
    status: 'COMPLETED', nextStep: 'AWAIT_COUNTERPART_RESPONSE', requestId: req.requestId,
    payload: { counterpartId, counterOffer: counterOfferText },
  });
  return res.json({ code: 'ESCAMBO_COUNTERED', offer: updated, actionReceipt });
});

export const completeOffer = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String(req.user?.userId || '').trim();
  const { offer, counterpartId } = await resolveOfferActor(String(req.params.id || ''), actorId);
  if (!offer) return res.status(404).json({ error: 'Proposta não encontrada.', code: 'ESCAMBO_NOT_FOUND' });

  if (isMockMode()) {
    const updated = { ...offer, status: 'completed', completed_at: new Date().toISOString() };
    mockAdapter.alchemy.offers.set(updated.id, updated);
    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'ESCAMBO', entityId: updated.id, action: 'COMPLETE', actorId,
      status: 'COMPLETED', nextStep: 'NONE', requestId: req.requestId, payload: { counterpartId },
    });
    return res.json({ code: 'ESCAMBO_COMPLETED', offer: updated, actionReceipt });
  }

  const updated = await prisma.swapOffer.update({ where: { id: offer.id }, data: { status: 'completed', completed_at: new Date() } });
  await interactionService.emitEscamboDecision({ actorId, counterpartId, offerId: offer.id, type: 'completed' });
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'ESCAMBO', entityId: offer.id, action: 'COMPLETE', actorId,
    status: 'COMPLETED', nextStep: 'NONE', requestId: req.requestId, payload: { counterpartId },
  });
  return res.json({ code: 'ESCAMBO_COMPLETED', offer: updated, actionReceipt });
});

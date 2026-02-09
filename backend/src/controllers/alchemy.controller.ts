import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const providerId = (req as any).user?.userId;
  const { requesterId, description } = req.body;


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
      providerId,
      requesterId,
      offerId: offer.id,
      description,
    });
  } catch (error) {
    interactionService.logInteractionFailure('escambo.create', error, {
      requestId: req.requestId,
      providerId,
      requesterId,
    });
  }

  return res.json({
    ...offer,
    code: 'ESCAMBO_CREATED',
  });
});

export const listOffers = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  

  const offers = await prisma.swapOffer.findMany({
    where: {
      OR: [{ provider_id: userId }, { requester_id: userId }]
    }
  });
  return res.json(offers);
});

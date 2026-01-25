import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';

export const createOffer = async (req: Request, res: Response) => {
  const providerId = (req as any).user?.userId;
  const { requesterId, description } = req.body;

  if (isMockMode()) {
    return res.json({
        id: 'mock-offer-id',
        provider_id: providerId || 'mock-pro',
        requester_id: requesterId || 'mock-client',
        description,
        status: 'pending'
    });
  }

  const offer = await prisma.swapOffer.create({
    data: {
      provider_id: providerId,
      requester_id: requesterId,
      description,
      status: 'pending'
    }
  });

  return res.json(offer);
};

export const listOffers = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  if (isMockMode()) {
    return res.json([
        { id: 'off-1', description: 'Troca de Reiki por Yoga', status: 'pending' }
    ]);
  }

  const offers = await prisma.swapOffer.findMany({
    where: {
      OR: [{ provider_id: userId }, { requester_id: userId }]
    }
  });
  return res.json(offers);
};

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createOffer = async (req: Request, res: Response) => {
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

  return res.json(offer);
};

export const listOffers = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const offers = await prisma.swapOffer.findMany({
    where: {
      OR: [{ provider_id: userId }, { requester_id: userId }]
    }
  });
  return res.json(offers);
};

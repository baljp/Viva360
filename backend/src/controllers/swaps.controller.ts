import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';

// Create a Swap Offer (Public Board)
export const createOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) throw new AppError('Usuário não autenticado', 401);

  const { offerTitle, offerDescription, seekTitle, seekDescription } = req.body;

  if (!offerTitle || !seekTitle) {
    throw new AppError('Títulos de oferta e busca são obrigatórios', 400);
  }

  const offer = await prisma.swapOffer.create({
    data: {
      professionalId: userId,
      offerTitle,
      offerDescription,
      seekTitle,
      seekDescription,
      status: 'ACTIVE'
    },
    include: {
      professional: {
        select: {
          name: true,
          avatar: true,
          professional: {
            select: {
              specialty: true,
              location: true
            }
          }
        }
      }
    }
  });

  res.status(201).json(offer);
});

// List all Swap Offers
export const listOffers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const offers = await prisma.swapOffer.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
     include: {
      professional: {
        select: {
          id: true,
          name: true,
          avatar: true,
          professional: {
            select: {
              specialty: true,
              location: true,
              swapCredits: true
            }
          }
        }
      }
    }
  });

  res.json(offers);
});

// Propose a direct match (creates a SwapRequest)
export const proposeMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const requesterId = req.user?.userId;
    const targetId = req.params.targetId as string;
    const { offerService, requestService, offerHours, requestHours, notes } = req.body;

    if (!requesterId) throw new AppError('Usuário não autenticado', 401);

    const swapRequest = await prisma.swapRequest.create({
        data: {
            requesterId,
            targetId,
            offerService,
            requestService,
            offerHours: Number(offerHours),
            requestHours: Number(requestHours),
            notes,
            status: 'PENDING'
        }
    });

    res.status(201).json(swapRequest);
});

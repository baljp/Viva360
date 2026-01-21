
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const reviewsController = {
  create: async (req: AuthRequest, res: Response) => {
    try {
      const { professionalId, rating, comment } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verify if professional exists
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId }
      });

      if (!professional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }

      const review = await prisma.review.create({
        data: {
          rating,
          comment,
          authorId: userId,
          recipientId: professional.userId,
        },
        include: {
          author: {
            select: {
              name: true,
              avatar: true
            }
          }
        }
      });

      // Update professional rating
      const reviews = await prisma.review.findMany({
        where: { recipientId: professional.userId }
      });
      
      const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
      
      await prisma.professional.update({
        where: { id: professionalId },
        data: { rating: avgRating, reviewCount: reviews.length }
      });

      return res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Erro ao criar avaliação' });
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const { professionalId } = req.query;

      if (!professionalId) {
        return res.status(400).json({ error: 'ID do profissional obrigatório' });
      }

      // Get professional to find userId
      const professional = await prisma.professional.findUnique({
        where: { id: String(professionalId) }
      });

      if (!professional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }

      const reviews = await prisma.review.findMany({
        where: { recipientId: professional.userId },
        include: {
          author: {
            select: {
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(reviews);
    } catch (error) {
      console.error('Error listing reviews:', error);
      return res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
  }
};

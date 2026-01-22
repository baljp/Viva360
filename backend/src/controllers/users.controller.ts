import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import { userService } from '../services/user.service';
import prisma from '../config/database';

// Get Current User Profile (from token)
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Usuário não autenticado', 401);

  const user = await userService.getMe(userId);
  res.json(user);
});

// Get User Profile by ID
export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = await userService.getUserProfile(String(id));
  res.json(user);
});

// Update User Profile
export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Usuário não autenticado', 401);

  const user = await userService.updateUserProfile(userId, req.body);
  res.json(user);
});

// Check-in (gamification)
export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Usuário não autenticado', 401);

  const result = await userService.performCheckIn(userId);
  res.json(result);
});

// Update Balance
export const updateBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { amount, type } = req.body; // type: 'corporate' or 'personal'

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  if (!amount || !type) {
    throw new AppError('Valor e tipo são obrigatórios', 400);
  }

  const field = type === 'corporate' ? 'corporateBalance' : 'personalBalance';
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      [field]: user[field] + amount,
    },
  });

  res.json(updatedUser);
});

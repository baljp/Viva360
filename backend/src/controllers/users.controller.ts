import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';

// Get User Profile
export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: String(id) },
    include: {
      professional: true,
      space: true,
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Update User Profile
export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const updates = req.body;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  // Remove sensitive fields from updates
  delete updates.password;
  delete updates.email;
  delete updates.role;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updates,
    include: {
      professional: true,
      space: true,
    },
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// Check-in (gamification)
export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const today = new Date().toISOString().split('T')[0];
  const lastCheckIn = user.lastCheckIn?.toISOString().split('T')[0];

  if (lastCheckIn === today) {
    throw new AppError('Check-in já realizado hoje', 400);
  }

  const reward = 50;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      karma: user.karma + reward,
      streak: user.streak + 1,
      lastCheckIn: new Date(),
      plantXp: user.plantXp + 10,
    },
  });

  res.json({
    message: 'Check-in realizado com sucesso!',
    reward,
    user: updatedUser,
  });
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

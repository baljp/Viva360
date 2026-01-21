import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';

// Get Space Rooms
export const getSpaceRooms = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const space = await prisma.space.findUnique({
    where: { userId },
    include: { rooms: true },
  });

  if (!space) {
    throw new AppError('Espaço não encontrado', 404);
  }

  res.json(space.rooms);
});

// Create Room
export const createRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { name, status, currentOccupant } = req.body;

  if (!userId || !name) {
    throw new AppError('Dados incompletos', 400);
  }

  const space = await prisma.space.findUnique({ where: { userId } });

  if (!space) {
    throw new AppError('Espaço não encontrado', 404);
  }

  const room = await prisma.room.create({
    data: {
      name,
      status: status || 'available',
      currentOccupant,
      spaceId: space.id,
    },
  });

  res.status(201).json(room);
});

// Get Space Team
export const getSpaceTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const space = await prisma.space.findUnique({
    where: { userId },
    include: {
      team: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              bio: true,
            },
          },
        },
      },
    },
  });

  if (!space) {
    throw new AppError('Espaço não encontrado', 404);
  }

  res.json(space.team);
});

// Get Space Vacancies
export const getSpaceVacancies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const space = await prisma.space.findUnique({
    where: { userId },
    include: { vacancies: true },
  });

  if (!space) {
    throw new AppError('Espaço não encontrado', 404);
  }

  res.json(space.vacancies);
});

// Create Vacancy
export const createVacancy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { title, description, specialties } = req.body;

  if (!userId || !title || !description) {
    throw new AppError('Dados incompletos', 400);
  }

  const space = await prisma.space.findUnique({ where: { userId } });

  if (!space) {
    throw new AppError('Espaço não encontrado', 404);
  }

  const vacancy = await prisma.vacancy.create({
    data: {
      title,
      description,
      specialties: specialties || [],
      spaceId: space.id,
    },
  });

  res.status(201).json(vacancy);
});

// Get All Vacancies (Public)
export const getAllVacancies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vacancies = await prisma.vacancy.findMany({
    where: { status: 'OPEN' },
    include: {
      space: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(vacancies);
});

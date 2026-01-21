import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';
import { cacheService } from '../services/cache.service';

// Get All Professionals
export const getAllProfessionals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { specialty, minRating, maxPrice } = req.query;

  // Cache key
  const cacheKey = `pros_list_${JSON.stringify(req.query)}`;
  const cachedData = cacheService.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  const where: any = {
    role: 'PROFESSIONAL',
    isActive: true,
  };

  const professionals = await prisma.user.findMany({
    where,
    include: {
      professional: true,
      reviewsReceived: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Filter by professional-specific criteria
  let filtered = professionals.filter(p => p.professional);

  if (specialty) {
    filtered = filtered.filter(p => {
      try {
        const specialties = JSON.parse(p.professional?.specialty || '[]');
        return Array.isArray(specialties) && specialties.some((s: string) => 
          s.toLowerCase().includes((specialty as string).toLowerCase())
        );
      } catch { return false; }
    });
  }

  if (minRating) {
    filtered = filtered.filter(p => p.professional!.rating >= parseFloat(String(minRating)));
  }

  if (maxPrice) {
    filtered = filtered.filter(p => p.professional!.pricePerSession <= parseFloat(String(maxPrice)));
  }

  // Remove passwords
  const sanitized = filtered.map(user => {
    const { password, ...rest } = user;
    return rest;
  });

  // Set cache
  cacheService.set(cacheKey, sanitized);

  res.json(sanitized);
});

// Get Professional by ID
export const getProfessionalById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const professional = await prisma.user.findUnique({
    where: { id: String(id), role: 'PROFESSIONAL' },
    include: {
      professional: true,
      reviewsReceived: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
      appointmentsAsPro: {
        where: { status: 'COMPLETED' },
        take: 5,
      },
    },
  });

  if (!professional) {
    throw new AppError('Profissional não encontrado', 404);
  }

  const { password: _, ...professionalWithoutPassword } = professional;
  res.json(professionalWithoutPassword);
});

// Update Professional Data
export const updateProfessional = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const updates = req.body;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { professional: true }
  });

  if (!user || user.role !== 'PROFESSIONAL') {
    throw new AppError('Usuário não é um profissional', 403);
  }

  if (!user.professional) {
    throw new AppError('Registro profissional não encontrado', 404);
  }

  // Update professional data
  const updatedProfessional = await prisma.professional.update({
    where: { userId },
    data: {
      specialty: updates.specialty,
      pricePerSession: updates.pricePerSession,
      location: updates.location,
      licenseNumber: updates.licenseNumber,
      isAvailableForSwap: updates.isAvailableForSwap,
      offers: updates.offers,
      needs: updates.needs,
    },
  });

  res.json(updatedProfessional);
});

// Get Professional's Patients
export const getProfessionalPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId: userId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
          phone: true,
        },
      },
    },
    distinct: ['clientId'],
  });

  const patients = appointments.map(apt => apt.client);

  res.json(patients);
});

// Financial Summary for Professional
export const getProfessionalFinance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  res.json({
    totalBalance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    transactions,
  });
});

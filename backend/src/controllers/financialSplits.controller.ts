import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/error';
import prisma from '../config/database';

// ==========================================
// FINANCIAL SPLITS CONTROLLER
// For: Guardião (Professional) & Santuário (Space) Profiles
// ==========================================

/**
 * Get financial summary with splits breakdown
 */
export const getFinanceSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { period = '30' } = req.query;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      professional: true,
      space: true,
    },
  });

  if (!user) throw new AppError('Usuário não encontrado', 404);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(period));

  // Get all completed appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { professionalId: userId },
        { professional: { professional: { spaceId: user.space?.id } } },
      ],
      status: 'COMPLETED',
      createdAt: { gte: startDate },
    },
    include: {
      professional: {
        select: {
          id: true,
          name: true,
          professional: {
            select: { spaceId: true },
          },
        },
      },
      client: {
        select: { name: true },
      },
    },
  });

  // Calculate splits
  let grossRevenue = 0;
  let netRevenue = 0;
  let platformFee = 0;
  let spaceSplit = 0;
  let professionalEarnings = 0;

  const splitDetails: any[] = [];

  for (const apt of appointments) {
    grossRevenue += apt.price;

    // Platform fee: 10%
    const platformCut = apt.price * 0.10;
    platformFee += platformCut;

    const afterPlatform = apt.price - platformCut;

    // Get professional's commission rate from TeamMember if space-affiliated
    const proUser = apt.professional as any;
    const spaceId = proUser?.professional?.spaceId;
    let proCommission = 0.70; // Default 70%

    if (spaceId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          spaceId_userId: {
            spaceId,
            userId: apt.professionalId,
          },
        },
      });
      if (teamMember) {
        proCommission = teamMember.commissionRate;
      }
    }

    const proEarning = afterPlatform * proCommission;
    const spaceEarning = afterPlatform * (1 - proCommission);

    professionalEarnings += proEarning;
    spaceSplit += spaceEarning;

    splitDetails.push({
      appointmentId: apt.id,
      serviceName: apt.serviceName,
      clientName: (apt.client as any).name,
      professionalName: proUser.name,
      grossAmount: apt.price,
      platformFee: platformCut,
      professionalEarning: proEarning,
      spaceEarning,
      date: apt.date,
    });
  }

  // Determine what to show based on user role
  if (user.role === 'PROFESSIONAL') {
    netRevenue = professionalEarnings;
  } else if (user.role === 'SPACE') {
    netRevenue = spaceSplit;
  }

  // Get pending withdrawals
  const pendingTransactions = await prisma.transaction.count({
    where: {
      userId,
      status: 'PENDING',
      type: 'INCOME',
    },
  });

  res.json({
    summary: {
      grossRevenue,
      netRevenue,
      platformFee,
      spaceSplit: user.role === 'SPACE' ? spaceSplit : undefined,
      professionalEarnings: user.role === 'PROFESSIONAL' ? professionalEarnings : undefined,
      pendingPayments: pendingTransactions,
      period: `${period} dias`,
    },
    splitDetails: user.role === 'SPACE' ? splitDetails : undefined,
    chartData: generateChartData(appointments, Number(period)),
  });
});

/**
 * Get detailed transaction history with splits
 */
export const getTransactionHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { page = 1, limit = 20, type } = req.query;

  const where: any = { userId };
  if (type) where.type = type as string;

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({
    data: transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Process payment split for completed appointment
 * Called after appointment completion
 */
export const processAppointmentSplit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appointmentId = req.params.appointmentId as string;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      professional: {
        include: {
          professional: {
            include: {
              space: true,
            },
          },
        },
      },
      client: true,
    },
  });

  if (!appointment) throw new AppError('Agendamento não encontrado', 404);
  if (appointment.status !== 'COMPLETED') {
    throw new AppError('O agendamento precisa estar completo para processar o split', 400);
  }

  const amount = appointment.price;
  const platformFee = amount * 0.10;
  const afterPlatform = amount - platformFee;

  // Type cast for included relations
  const proUser = appointment.professional as any;
  const clientUser = appointment.client as any;

  // Get professional's space affiliation if any
  const profData = proUser.professional;
  const space = profData?.space;
  const commissionRate = 0.70; // Default or from TeamMember

  // Get commission rate from TeamMember if exists
  let teamMember = null;
  if (space) {
    teamMember = await prisma.teamMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: appointment.professionalId,
        },
      },
    });
  }

  const actualCommissionRate = teamMember?.commissionRate || commissionRate;
  const professionalEarning = afterPlatform * actualCommissionRate;
  const spaceEarning = afterPlatform * (1 - actualCommissionRate);

  // Create transactions
  const transactions = [];

  // Professional earning
  transactions.push(
    prisma.transaction.create({
      data: {
        userId: appointment.professionalId,
        type: 'INCOME',
        amount: professionalEarning,
        description: `Sessão: ${appointment.serviceName} - ${clientUser.name}`,
        reference: appointmentId,
        status: 'COMPLETED',
      },
    })
  );

  // Space earning (if affiliated)
  if (space) {
    transactions.push(
      prisma.transaction.create({
        data: {
          userId: space.userId,
          type: 'INCOME',
          amount: spaceEarning,
          description: `Split: ${appointment.serviceName} - ${proUser.name}`,
          reference: appointmentId,
          status: 'COMPLETED',
        },
      })
    );

    // Update team member stats
    transactions.push(
      prisma.teamMember.update({
        where: {
          spaceId_userId: {
            spaceId: space.id,
            userId: appointment.professionalId,
          },
        },
        data: {
          totalSessions: { increment: 1 },
          totalRevenue: { increment: professionalEarning },
        },
      })
    );
  }

  await prisma.$transaction(transactions);

  res.json({
    success: true,
    split: {
      grossAmount: amount,
      platformFee,
      professionalEarning,
      spaceEarning: space ? spaceEarning : 0,
      commissionRate: actualCommissionRate,
    },
  });
});

/**
 * Update team member commission rate
 */
export const updateCommissionRate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const memberId = req.params.memberId as string;
  const { commissionRate } = req.body;

  if (commissionRate < 0.3 || commissionRate > 0.95) {
    throw new AppError('Taxa de comissão deve estar entre 30% e 95%', 400);
  }

  // Verify space ownership
  const space = await prisma.space.findUnique({ where: { userId } });
  if (!space) throw new AppError('Espaço não encontrado', 404);

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      id: memberId,
      spaceId: space.id,
    },
  });

  if (!teamMember) throw new AppError('Membro não encontrado', 404);

  const updated = await prisma.teamMember.update({
    where: { id: memberId },
    data: { commissionRate },
    include: {
      user: {
        select: { name: true, email: true, avatar: true },
      },
    },
  });

  res.json({
    success: true,
    message: `Taxa de comissão atualizada para ${(commissionRate * 100).toFixed(0)}%`,
    member: updated,
  });
});

/**
 * Get team performance metrics for space owner
 */
export const getTeamPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { period = '30' } = req.query;

  const space = await prisma.space.findUnique({ where: { userId } });
  if (!space) throw new AppError('Espaço não encontrado', 404);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(period));

  const teamMembers = await prisma.teamMember.findMany({
    where: { spaceId: space.id, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          professional: {
            select: { rating: true, specialty: true },
          },
        },
      },
    },
  });

  // Get appointments for each team member
  const performance = await Promise.all(
    teamMembers.map(async (member) => {
      const appointments = await prisma.appointment.findMany({
        where: {
          professionalId: member.userId,
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      });

      const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0);
      const avgSessionValue = appointments.length > 0 ? totalRevenue / appointments.length : 0;

      return {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        avatar: member.user.avatar,
        rating: member.user.professional?.rating || 0,
        specialty: member.user.professional?.specialty,
        commissionRate: member.commissionRate,
        sessionsThisPeriod: appointments.length,
        revenueThisPeriod: totalRevenue,
        avgSessionValue,
        totalSessions: member.totalSessions,
        totalRevenue: member.totalRevenue,
      };
    })
  );

  // Sort by revenue
  performance.sort((a, b) => b.revenueThisPeriod - a.revenueThisPeriod);

  res.json({
    team: performance,
    totals: {
      sessions: performance.reduce((sum, p) => sum + p.sessionsThisPeriod, 0),
      revenue: performance.reduce((sum, p) => sum + p.revenueThisPeriod, 0),
      avgCommissionRate: performance.length > 0 
        ? performance.reduce((sum, p) => sum + p.commissionRate, 0) / performance.length 
        : 0.70,
    },
    period: `${period} dias`,
  });
});

/**
 * Request withdrawal
 */
export const requestWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { amount, pixKey } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuário não encontrado', 404);

  const availableBalance = user.personalBalance;

  if (amount > availableBalance) {
    throw new AppError(`Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`, 400);
  }

  if (amount < 50) {
    throw new AppError('Valor mínimo para saque é R$ 50,00', 400);
  }

  // Create withdrawal transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: 'EXPENSE',
      amount,
      description: `Saque PIX: ${pixKey}`,
      status: 'PENDING',
      paymentMethod: 'PIX',
    },
  });

  // Update user balance
  await prisma.user.update({
    where: { id: userId },
    data: {
      personalBalance: { decrement: amount },
    },
  });

  res.json({
    success: true,
    message: 'Solicitação de saque recebida. Será processado em até 24h.',
    transaction,
    newBalance: availableBalance - amount,
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateChartData(appointments: any[], period: number): any {
  const data: { date: string; revenue: number }[] = [];
  const now = new Date();

  // Group by day
  const byDay = new Map<string, number>();

  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    byDay.set(dateStr, 0);
  }

  for (const apt of appointments) {
    const dateStr = new Date(apt.date).toISOString().split('T')[0];
    if (byDay.has(dateStr)) {
      byDay.set(dateStr, (byDay.get(dateStr) || 0) + apt.price);
    }
  }

  for (const [date, revenue] of byDay) {
    data.push({ date, revenue });
  }

  return data;
}

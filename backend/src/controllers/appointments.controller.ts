import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';

// Create Appointment
export const createAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { professionalId, serviceName, price, date, time, duration } = req.body;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  if (!professionalId || !serviceName || !price || !date || !time) {
    throw new AppError('Dados incompletos para criar agendamento', 400);
  }

  const client = await prisma.user.findUnique({ where: { id: userId } });
  const professional = await prisma.user.findUnique({ where: { id: professionalId } });

  if (!client || !professional) {
    throw new AppError('Cliente ou profissional não encontrado', 404);
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientId: userId,
      professionalId,
      serviceName,
      price,
      date: new Date(date),
      time,
      duration: duration || 60,
      status: 'PENDING',
    },
  });

  // Create transaction
  await prisma.transaction.create({
    data: {
      userId,
      type: 'EXPENSE',
      amount: price,
      description: `Agendamento: ${serviceName}`,
      reference: appointment.id,
      status: 'COMPLETED',
    },
  });

  // Update client balance
  await prisma.user.update({
    where: { id: userId },
    data: {
      personalBalance: client.personalBalance - price,
      karma: client.karma + Math.floor(price * 2),
      plantXp: client.plantXp + Math.floor(price / 10),
    },
  });

  // Create notification for professional
  await prisma.notification.create({
    data: {
      userId: professionalId,
      type: 'APPOINTMENT',
      title: 'Novo Agendamento',
      message: `${client.name} agendou ${serviceName} para ${new Date(date).toLocaleDateString()}`,
      actionUrl: `/appointments/${appointment.id}`,
    },
  });

  res.status(201).json(appointment);
});

// Get User Appointments
export const getUserAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const where = role === 'CLIENT' 
    ? { clientId: userId }
    : { professionalId: userId };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  res.json(appointments);
});

// Get Appointment by ID
export const getAppointmentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
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
      professional: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  // Check authorization
  if (appointment.clientId !== userId && appointment.professionalId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  res.json(appointment);
});

// Update Appointment Status
export const updateAppointmentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.user?.userId;

  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  // Check authorization
  if (appointment.professionalId !== userId) {
    throw new AppError('Apenas o profissional pode atualizar o status', 403);
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status,
      ...(notes && { notes }),
    },
  });

  // If completed, create income transaction for professional
  if (status === 'COMPLETED') {
    await prisma.transaction.create({
      data: {
        userId: appointment.professionalId,
        type: 'INCOME',
        amount: appointment.price,
        description: `Sessão concluída: ${appointment.serviceName}`,
        reference: appointment.id,
        status: 'COMPLETED',
      },
    });

    // Update professional stats
    const professional = await prisma.professional.findUnique({
      where: { userId: appointment.professionalId },
    });

    if (professional) {
      await prisma.professional.update({
        where: { userId: appointment.professionalId },
        data: {
          totalHealingHours: professional.totalHealingHours + (appointment.duration / 60),
        },
      });
    }
  }

  res.json(updated);
});

// Cancel Appointment
export const cancelAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  // Check authorization
  if (appointment.clientId !== userId && appointment.professionalId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  // Refund client if cancelled by professional or within 24h
  const hoursUntilAppointment = (appointment.date.getTime() - Date.now()) / (1000 * 60 * 60);
  
  if (appointment.professionalId === userId || hoursUntilAppointment > 24) {
    const client = await prisma.user.findUnique({ where: { id: appointment.clientId } });
    
    if (client) {
      await prisma.user.update({
        where: { id: appointment.clientId },
        data: {
          personalBalance: client.personalBalance + appointment.price,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: appointment.clientId,
          type: 'INCOME',
          amount: appointment.price,
          description: `Reembolso: ${appointment.serviceName}`,
          reference: appointment.id,
          status: 'COMPLETED',
        },
      });
    }
  }

  res.json(updated);
});

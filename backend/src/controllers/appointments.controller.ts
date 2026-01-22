import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';
import { pushService } from '../services/push.service';
import { queueNotification } from '../config/queue';

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

  // CRITICAL: Use transaction for atomic operations (30k scale fix)
  const result = await prisma.$transaction(async (tx) => {
    // Create appointment
    const appointment = await tx.appointment.create({
      data: {
        clientId: userId,
        professionalId,
        serviceName,
        price,
        date: new Date(date),
        time,
        duration: duration || 60,
        status: 'PENDING',
        type: req.body.type || 'PAID',
      },
    });

    // Create transaction record
    await tx.transaction.create({
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
    await tx.user.update({
      where: { id: userId },
      data: {
        personalBalance: client.personalBalance - price,
        karma: client.karma + Math.floor(price * 2),
        plantXp: client.plantXp + Math.floor(price / 10),
      },
    });

// ...
    // Create notification for professional
    await tx.notification.create({
      data: {
        userId: professionalId,
        type: 'APPOINTMENT',
        title: 'Novo Agendamento',
        message: `${client.name} agendou ${serviceName} para ${new Date(date).toLocaleDateString()}`,
        actionUrl: `/appointments/${appointment.id}`,
      },
    });

    return appointment;
  });

  // Async: Queue Push Notification Side Effect
  queueNotification({
      userId: professionalId,
      title: 'Novo Agendamento',
      message: `Você tem um novo agendamento de ${serviceName}.`
  }).catch(console.error);

  res.status(201).json(result);
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
  const { id } = req.params as { id: string };
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
  const { id } = req.params as { id: string };
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

  // CRITICAL: Use transaction for atomic status update + income (30k scale fix)
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id },
      data: {
        status,
        ...(notes && { notes }),
      },
    });

    // If completed, create income transaction for professional
    if (status === 'COMPLETED') {
      await tx.transaction.create({
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
      const professional = await tx.professional.findUnique({
        where: { userId: appointment.professionalId },
      });

      if (professional) {
        await tx.professional.update({
          where: { userId: appointment.professionalId },
          data: {
            totalHealingHours: professional.totalHealingHours + (appointment.duration / 60),
          },
        });
      }
    }

    return updated;
  });

  res.json(result);
});

// Cancel Appointment
export const cancelAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.userId;

  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  // Check authorization
  if (appointment.clientId !== userId && appointment.professionalId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  // CRITICAL: Use transaction for atomic cancel + refund (30k scale fix)
  const hoursUntilAppointment = (appointment.date.getTime() - Date.now()) / (1000 * 60 * 60);
  const shouldRefund = appointment.professionalId === userId || hoursUntilAppointment > 24;
  
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Refund client if applicable
    if (shouldRefund) {
      const client = await tx.user.findUnique({ where: { id: appointment.clientId } });
      
      if (client) {
        await tx.user.update({
          where: { id: appointment.clientId },
          data: {
            personalBalance: client.personalBalance + appointment.price,
          },
        });

        await tx.transaction.create({
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

    return updated;
  });

  res.json(result);
});

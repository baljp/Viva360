import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/error';
import prisma from '../config/database';
import { io } from '../server';

// ==========================================
// REAL-TIME ROOM MANAGEMENT CONTROLLER
// For: Santuário (Space) Profile
// IoT Simulation & Live Room Status
// ==========================================

/**
 * Get all rooms with real-time status
 */
export const getRoomsRealTime = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const space = await prisma.space.findUnique({
    where: { userId },
    include: {
      rooms: {
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!space) throw new AppError('Espaço não encontrado', 404);

  // Get current bookings for each room
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const roomsWithStatus = await Promise.all(
    space.rooms.map(async (room) => {
      // Get today's bookings for this room
      const todayBookings = await prisma.roomBooking.findMany({
        where: {
          roomId: room.id,
          date: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
          },
          status: { not: 'CANCELLED' },
        },
        include: {
          user: {
            select: { name: true, avatar: true },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      // Find current booking
      const currentBooking = todayBookings.find((booking) => {
        return booking.startTime <= currentTime && booking.endTime > currentTime;
      });

      // Find next booking
      const nextBooking = todayBookings.find((booking) => {
        return booking.startTime > currentTime;
      });

      // Calculate availability windows
      const availableSlots = calculateAvailableSlots(todayBookings, currentTime);

      // Simulate IoT sensor data
      const sensorData = simulateIoTSensors(room.status, currentBooking !== undefined);

      return {
        id: room.id,
        name: room.name,
        status: currentBooking ? 'occupied' : room.status,
        currentOccupant: currentBooking?.user.name || room.currentOccupant,
        currentOccupantAvatar: currentBooking?.user.avatar,
        currentBookingEndsAt: currentBooking?.endTime,
        nextBooking: nextBooking ? {
          userName: nextBooking.user.name,
          startTime: nextBooking.startTime,
          endTime: nextBooking.endTime,
        } : null,
        todayBookingsCount: todayBookings.length,
        availableSlots,
        sensors: sensorData,
        updatedAt: new Date().toISOString(),
      };
    })
  );

  res.json({
    rooms: roomsWithStatus,
    summary: {
      total: roomsWithStatus.length,
      available: roomsWithStatus.filter((r) => r.status === 'available').length,
      occupied: roomsWithStatus.filter((r) => r.status === 'occupied').length,
      maintenance: roomsWithStatus.filter((r) => r.status === 'maintenance').length,
    },
    lastUpdate: new Date().toISOString(),
  });
});

/**
 * Update room status (manual override or IoT trigger)
 */
export const updateRoomStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const roomId = req.params.roomId as string;
  const { status, currentOccupant, reason } = req.body;

  // Verify ownership
  const space = await prisma.space.findUnique({ where: { userId } });
  if (!space) throw new AppError('Espaço não encontrado', 404);

  const room = await prisma.room.findFirst({
    where: { id: roomId, spaceId: space.id },
  });

  if (!room) throw new AppError('Sala não encontrada', 404);

  const validStatuses = ['available', 'occupied', 'maintenance'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Status inválido', 400);
  }

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: {
      status,
      currentOccupant: status === 'occupied' ? currentOccupant : null,
    },
  });

  // Emit real-time update via WebSocket
  if (io) {
    io.to(`space:${space.id}`).emit('room:statusChange', {
      roomId: updated.id,
      roomName: updated.name,
      status: updated.status,
      currentOccupant: updated.currentOccupant,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    room: updated,
    message: `Status da sala "${updated.name}" atualizado para ${getStatusLabel(status)}`,
  });
});

/**
 * Create a room booking
 */
export const createRoomBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { roomId, date, startTime, endTime, price } = req.body;

  // Validate time format
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    throw new AppError('Formato de horário inválido. Use HH:MM', 400);
  }

  if (startTime >= endTime) {
    throw new AppError('Horário de início deve ser anterior ao horário de fim', 400);
  }

  // Check room exists
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError('Sala não encontrada', 404);

  // Check for conflicts
  const conflictingBooking = await prisma.roomBooking.findFirst({
    where: {
      roomId,
      date: new Date(date),
      status: { not: 'CANCELLED' },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
  });

  if (conflictingBooking) {
    throw new AppError(
      `Conflito de horário: Sala já reservada de ${conflictingBooking.startTime} às ${conflictingBooking.endTime}`,
      409
    );
  }

  // Calculate duration in minutes
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const duration = (endH * 60 + endM) - (startH * 60 + startM);

  const booking = await prisma.roomBooking.create({
    data: {
      roomId,
      userId,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      price: price || 0,
      status: 'CONFIRMED',
    },
    include: {
      room: true,
      user: {
        select: { name: true, email: true },
      },
    },
  });

  // Emit real-time update
  const space = await prisma.room.findUnique({
    where: { id: roomId },
    select: { spaceId: true },
  });

  if (io && space) {
    io.to(`space:${space.spaceId}`).emit('room:newBooking', {
      booking: {
        id: booking.id,
        roomName: booking.room.name,
        userName: booking.user.name,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
      timestamp: new Date().toISOString(),
    });
  }

  res.status(201).json({
    success: true,
    booking,
    message: `Reserva confirmada: ${room.name} em ${new Date(date).toLocaleDateString('pt-BR')} das ${startTime} às ${endTime}`,
  });
});

/**
 * Cancel a room booking
 */
export const cancelRoomBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const bookingId = req.params.bookingId as string;

  const booking = await prisma.roomBooking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { userId },
        { room: { space: { userId } } },
      ],
    },
    include: { room: true },
  });

  if (!booking) throw new AppError('Reserva não encontrada', 404);
  if (booking.status === 'CANCELLED') {
    throw new AppError('Reserva já foi cancelada', 400);
  }

  const updated = await prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  });

  // Emit real-time update
  const space = await prisma.room.findUnique({
    where: { id: booking.roomId },
    select: { spaceId: true },
  });

  if (io && space) {
    io.to(`space:${space.spaceId}`).emit('room:bookingCancelled', {
      bookingId,
      roomId: booking.roomId,
      roomName: booking.room.name,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: 'Reserva cancelada com sucesso',
    booking: updated,
  });
});

/**
 * Get room schedule for a specific date
 */
export const getRoomSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const roomId = req.params.roomId as string;
  const date = req.query.date as string | undefined;

  const targetDate = date ? new Date(date) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0];

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError('Sala não encontrada', 404);

  const bookings = await prisma.roomBooking.findMany({
    where: {
      roomId,
      date: {
        gte: new Date(dateStr),
        lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000),
      },
      status: { not: 'CANCELLED' },
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Generate time slots (8:00 - 20:00, 1 hour each)
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    const slotStart = `${hour.toString().padStart(2, '0')}:00`;
    const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

    const booking = bookings.find(
      (b) => b.startTime <= slotStart && b.endTime > slotStart
    );

    slots.push({
      time: slotStart,
      endTime: slotEnd,
      isAvailable: !booking,
      booking: booking ? {
        id: booking.id,
        userName: booking.user.name,
        userAvatar: booking.user.avatar,
        startTime: booking.startTime,
        endTime: booking.endTime,
      } : null,
    });
  }

  res.json({
    room: {
      id: room.id,
      name: room.name,
      status: room.status,
    },
    date: dateStr,
    slots,
    bookingsCount: bookings.length,
  });
});

/**
 * Get space analytics (dashboard data)
 */
export const getSpaceAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { period = '7' } = req.query;

  const space = await prisma.space.findUnique({
    where: { userId },
    include: { rooms: true },
  });

  if (!space) throw new AppError('Espaço não encontrado', 404);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(period));

  // Get all bookings in period
  const bookings = await prisma.roomBooking.findMany({
    where: {
      room: { spaceId: space.id },
      date: { gte: startDate },
      status: { not: 'CANCELLED' },
    },
    include: { room: true },
  });

  // Calculate occupancy by room
  const roomStats = space.rooms.map((room) => {
    const roomBookings = bookings.filter((b) => b.roomId === room.id);
    const totalMinutes = roomBookings.reduce((sum, b) => sum + b.duration, 0);
    const totalHours = totalMinutes / 60;
    const maxHours = Number(period) * 12; // 12 hours per day available
    const occupancyRate = (totalHours / maxHours) * 100;
    const revenue = roomBookings.reduce((sum, b) => sum + b.price, 0);

    return {
      roomId: room.id,
      roomName: room.name,
      bookingsCount: roomBookings.length,
      totalHours,
      occupancyRate: Math.round(occupancyRate),
      revenue,
    };
  });

  // Daily stats for chart
  const dailyStats = [];
  for (let i = Number(period) - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayBookings = bookings.filter(
      (b) => b.date.toISOString().split('T')[0] === dateStr
    );

    dailyStats.push({
      date: dateStr,
      bookings: dayBookings.length,
      revenue: dayBookings.reduce((sum, b) => sum + b.price, 0),
      hours: dayBookings.reduce((sum, b) => sum + b.duration, 0) / 60,
    });
  }

  res.json({
    summary: {
      totalRooms: space.rooms.length,
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.price, 0),
      avgOccupancy: roomStats.length > 0
        ? Math.round(roomStats.reduce((sum, r) => sum + r.occupancyRate, 0) / roomStats.length)
        : 0,
    },
    roomStats,
    dailyStats,
    period: `${period} dias`,
  });
});

/**
 * Simulate IoT sensor trigger (for testing/demo)
 */
export const simulateIoTTrigger = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roomId, sensorType, value } = req.body;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { space: true },
  });

  if (!room) throw new AppError('Sala não encontrada', 404);

  // Simulate sensor processing
  let action = null;
  let newStatus = room.status;

  switch (sensorType) {
    case 'motion':
      if (value && room.status === 'available') {
        newStatus = 'occupied';
        action = 'Movimento detectado - sala marcada como ocupada';
      } else if (!value && room.status === 'occupied') {
        // Wait 15 minutes of no motion before marking available
        action = 'Sem movimento detectado - aguardando confirmação';
      }
      break;
    case 'door':
      if (value === 'open' && room.status === 'available') {
        action = 'Porta aberta - possível ocupação';
      }
      break;
    case 'temperature':
      if (value > 28) {
        action = 'Temperatura alta - verificar ar condicionado';
      }
      break;
    case 'light':
      if (value > 0 && room.status === 'available') {
        action = 'Luz acesa em sala disponível - verificar ocupação';
      }
      break;
  }

  // Update room if status changed
  if (newStatus !== room.status) {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: newStatus },
    });
  }

  // Emit sensor event
  if (io) {
    io.to(`space:${room.spaceId}`).emit('room:sensorUpdate', {
      roomId,
      roomName: room.name,
      sensorType,
      value,
      action,
      newStatus,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    room: {
      id: room.id,
      name: room.name,
      previousStatus: room.status,
      newStatus,
    },
    sensor: { type: sensorType, value },
    action,
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateAvailableSlots(bookings: any[], currentTime: string): string[] {
  const slots: string[] = [];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

  for (const hour of hours) {
    const slotTime = `${hour.toString().padStart(2, '0')}:00`;
    if (slotTime < currentTime) continue;

    const isBooked = bookings.some(
      (b) => b.startTime <= slotTime && b.endTime > slotTime
    );

    if (!isBooked) {
      slots.push(slotTime);
    }
  }

  return slots;
}

function simulateIoTSensors(status: string, isOccupied: boolean): any {
  return {
    motion: isOccupied,
    temperature: 22 + Math.random() * 4,
    humidity: 45 + Math.random() * 15,
    lightLevel: isOccupied ? 70 + Math.random() * 30 : Math.random() * 10,
    lastUpdate: new Date().toISOString(),
  };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponível',
    occupied: 'Ocupada',
    maintenance: 'Em Manutenção',
  };
  return labels[status] || status;
}

function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

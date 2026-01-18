import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../src/lib/prisma';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    const { userId } = request.query;

    try {
        if (request.method === 'GET') {
            if (!userId) return response.status(400).json({ error: 'User ID required' });

            const appointments = await prisma.appointment.findMany({
                where: { clientId: String(userId) },
                orderBy: { date: 'asc' },
            });
            return response.status(200).json(appointments);
        }

        if (request.method === 'POST') {
            const { clientId, professionalId, serviceId, serviceName, date, price } = request.body;

            if (!clientId || !professionalId || !date) {
                return response.status(400).json({ error: 'Missing required fields' });
            }

            // Transactional create: Appointment + Transaction + Notification
            const appointment = await prisma.$transaction(async (tx) => {
                const appt = await tx.appointment.create({
                    data: {
                        clientId,
                        professionalId,
                        serviceId,
                        serviceName,
                        date: new Date(date),
                        price: parseFloat(price),
                        status: 'confirmed',
                    },
                });

                // Create Transaction record
                await tx.transaction.create({
                    data: {
                        userId: clientId,
                        amount: parseFloat(price),
                        type: 'expense',
                        description: `Agendamento: ${serviceName}`,
                    },
                });

                // Create Notification for Client
                await tx.notification.create({
                    data: {
                        userId: clientId,
                        title: 'Agendamento Confirmado',
                        message: `Sua sessão de ${serviceName} foi reservada com sucesso.`,
                        type: 'appointment',
                    },
                });

                return appt;
            });

            return response.status(201).json(appointment);
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Appointment error:', error);
        return response.status(500).json({ error: 'Failed to process appointment' });
    }
}

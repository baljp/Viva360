import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';

// --- SCHEMAS ---
const createRoomSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['healing', 'meditation', 'movement', 'ritual']),
  capacity: z.number().int().positive().optional(),
});

const createInviteSchema = z.object({
  role: z.enum(['GUARDIAN', 'ADMIN', 'MEMBER']),
  uses: z.number().int().positive().default(1),
});

// --- CONTROLLERS ---

// 1. Analytics Dashboard — dados reais agregados
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    // Revenue: soma de todas as transações completed
    const revenueAgg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
    });
    const revenue = Number(revenueAgg._sum.amount) || 0;

    // Appointments: total
    const totalAppointments = await prisma.appointment.count();

    // Guardians ativos
    const activeGuardians = await prisma.user.count({ where: { role: 'PROFESSIONAL' } });

    // Occupancy: % de rooms ocupadas (current_occupant não-nulo ou status 'occupied')
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({
        where: {
            OR: [
                { status: 'occupied' },
                { current_occupant: { not: null } },
            ],
        },
    });
    const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return res.json({
        appointments: totalAppointments,
        revenue,
        guardians: activeGuardians,
        occupancy,
    });
});

// 2. Reputation / Reviews
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
    const reviews = await prisma.review.findMany({
        take: 20,
        orderBy: { created_at: 'desc' },
        include: { author: { select: { name: true, avatar: true } } }
    });

    const avg = reviews.reduce((acc, r: any) => acc + Number(r.rating), 0) / (reviews.length || 1);

    return res.json({
        average: avg.toFixed(1),
        count: reviews.length,
        reviews: reviews.map((r: any) => ({
            id: r.id,
            author: r.author?.name || 'Anônimo',
            rating: Number(r.rating),
            comment: r.comment,
            date: r.created_at,
            target: r.target_id
        }))
    });
});

// 3. Create Room
export const createRoom = asyncHandler(async (req: Request, res: Response) => {
    const { name, type, capacity } = createRoomSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const room = await prisma.room.create({
        data: {
            name,
            type,
            capacity: capacity || 10,
            hub_id: userId
        }
    });

    return res.json(room);
});

// 4. Generate Invite — agora persiste no banco via SpaceInvite
export const createInvite = asyncHandler(async (req: Request, res: Response) => {
    const { role, uses } = createInviteSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const code = `VIVA-${role.substring(0, 3)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // expira em 7 dias

    const invite = await prisma.spaceInvite.create({
        data: {
            space_id: userId,
            code,
            role,
            max_usage: uses,
            usage: 0,
            status: 'active',
            expires_at: expiresAt,
        },
    });

    return res.json({
        id: invite.id,
        code: invite.code,
        role: invite.role,
        expires: invite.expires_at,
        usage: invite.usage,
        maxUsage: invite.max_usage,
        status: invite.status,
    });
});

// 5. Contract — query real no model Contract
export const getContract = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // Busca contrato ativo do guardian logado
    const contract = await prisma.contract.findFirst({
        where: {
            guardian_id: userId,
            status: 'active',
        },
        orderBy: { created_at: 'desc' },
    });

    if (!contract) {
        return res.status(404).json({ error: 'Nenhum contrato ativo encontrado' });
    }

    const now = new Date();
    const endDate = new Date(contract.end_date);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return res.json({
        id: contract.id,
        spaceName: contract.space_name,
        startDate: contract.start_date,
        endDate: contract.end_date,
        status: contract.status,
        monthlyFee: Number(contract.monthly_fee),
        revenueShare: contract.revenue_share,
        roomsAllowed: contract.rooms_allowed,
        hoursPerWeek: contract.hours_per_week,
        benefits: contract.benefits,
        rules: contract.rules,
        daysRemaining,
        terms: contract.terms,
        signed: contract.signed,
        version: contract.version,
    });
});

// 6. List Spaces
export const listSpaces = asyncHandler(async (req: Request, res: Response) => {
    const spaces = await prisma.profile.findMany({
        where: { role: 'SPACE' },
        take: 10,
        select: {
            id: true,
            name: true,
            location: true,
            avatar: true
        }
    });

    const results = spaces.map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.location || 'Endereço não informado',
        city: 'Cidade Exemplo',
        rating: 5.0,
        guardiansCount: 12,
        status: 'active',
        image: s.avatar || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
        specialties: ['Yoga', 'Meditação']
    }));

    if (results.length === 0) {
        return res.json([{
            id: 's1',
            name: 'Espaço Gaia (Demo)',
            address: 'Rua das Flores, 123',
            city: 'São Paulo, SP',
            rating: 4.8,
            guardiansCount: 12,
            status: 'active',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
            specialties: ['Yoga', 'Meditação', 'Terapia Holística']
        }]);
    }

    return res.json(results);
});

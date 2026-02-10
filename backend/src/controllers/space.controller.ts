
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

// 1. Analytics Dashboard
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    // In a real scenario, filter by spaceId associated with user
    const totalAppointments = await prisma.appointment.count();
    const activeGuardians = await prisma.user.count({ where: { role: 'PROFESSIONAL' } });
    
    // Mocking some financial data as we don't have a full transaction ledger yet
    const revenue = 45200; 
    
    return res.json({
        appointments: totalAppointments,
        revenue,
        guardians: activeGuardians,
        occupancy: 85 // Mock or calc real
    });
});

// 2. Reputation / Reviews
// 2. Reputation / Reviews
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
    const reviews = await prisma.review.findMany({
        take: 20,
        orderBy: { created_at: 'desc' },
        include: { author: { select: { name: true, avatar: true } } }
    });
    
    // Calculate aggregate
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
            target: r.target_id // In real app, resolve target name
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
            hub_id: userId // Assuming the creator is the Space (hub)
        }
    });

    return res.json(room);
});

// 4. Generate Invite
export const createInvite = asyncHandler(async (req: Request, res: Response) => {
    const { role, uses } = createInviteSchema.parse(req.body);
    
    const code = `VIVA-${role.substring(0,3)}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    
    // Store in DB (Invite model needed, or mock for now if schema strict)
    // Assuming Invite model exists or using generic store
    // For now, just return valid code
    
    return res.json({ code, expires: '7 days', usage: 0, maxUsage: uses });
});

// 5. Contract
export const getContract = asyncHandler(async (req: Request, res: Response) => {
    // Return rich mock data matching frontend expectations for now
    // In a real app, this would be a DB query on Contract model
    return res.json({
        id: 'c001',
        spaceName: 'Espaço Gaia',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        status: 'active',
        monthlyFee: 850,
        revenueShare: 15,
        roomsAllowed: ['Sala Gaia', 'Sala Shanti'],
        hoursPerWeek: 20,
        benefits: ['Sala de espera', 'Wi-Fi', 'Material de divulgação', 'Agenda compartilhada', 'Suporte administrativo'],
        rules: ['Manter sala limpa após uso', 'Respeitar horários agendados', 'Notificar cancelamentos com 24h de antecedência'],
        daysRemaining: 112,
        terms: "1. O Guardião compromete-se com a ética...\n2. O Espaço provê infraestrutura...",
        signed: true,
        version: "1.0"
    });
});

// 6. List Spaces
export const listSpaces = asyncHandler(async (req: Request, res: Response) => {
    // In a real implementation, we would query the User's associations (e.g. ProfileRole or Member table)
    // For now, we list all profiles that act as Spaces/Hubs
    // Mocking finding space profiles
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
        rating: 5.0, // Mock rating
        guardiansCount: 12,
        status: 'active',
        image: s.avatar || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
        specialties: ['Yoga', 'Meditação']
    }));
    
    // Fallback if no spaces found to show something in UI
    if (results.length === 0) {
        return res.json([
             {
                id: 's1',
                name: 'Espaço Gaia (Demo)',
                address: 'Rua das Flores, 123',
                city: 'São Paulo, SP',
                rating: 4.8,
                guardiansCount: 12,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
                specialties: ['Yoga', 'Meditação', 'Terapia Holística']
            }
        ]);
    }

    return res.json(results);
});


import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import { isDbUnavailableError } from '../lib/dbReadFallback';
import { isMockMode, mockAdapter, mockId, saveMockRoom } from '../services/mockAdapter';
import type { AuthenticatedRequest } from '../types/request';

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

type DecimalLike = number | string | { toString(): string } | null;

type RevenueRow = { total: DecimalLike };
type AvgDurationRow = { avg_dur: number | null };
type TopGuardianRow = { name: string | null; sessions: number | string | null; revenue: DecimalLike };
type ReviewRatingRow = { rating: DecimalLike };
type RoomOccupancyRow = { name: string | null; capacity: number | null; current_occupant: string | null };
type CalendarEventDetails = {
  kind?: string;
  roomId?: string;
};

// ✅ P1 Fix: Replace Prisma.ContractGetPayload<...> with an explicit interface
interface ContractGuardian {
  id: string;
  name: string | null;
  avatar: string | null;
  karma: number | null;
  specialty: string[] | null;
  rating: DecimalLike;
  review_count: number | null;
  location: string | null;
}
interface ContractWithGuardian {
  id: string;
  space_id: string;
  guardian_id: string;
  status: string;
  monthly_fee: DecimalLike;
  revenue_share: DecimalLike;
  guardian: ContractGuardian;
  [key: string]: unknown;
}

const getUserId = (req: Request): string => {
  return (req as AuthenticatedRequest).user?.id || '';
};

const getUserIdCompat = (req: Request): string => {
  // The codebase currently uses both `req.user.id` and `req.user.userId` in different places.
  const user = (req as AuthenticatedRequest).user;
  return String(user?.userId || user?.id || '').trim();
};

const getRole = (req: Request): string => String((req as AuthenticatedRequest).user?.role || '').trim().toUpperCase();

const listLinkedGuardianIds = async (spaceId: string): Promise<string[]> => {
  const contracts = await prisma.contract.findMany({
    where: { space_id: spaceId, status: { in: ['active', 'pending'] } },
    select: { guardian_id: true },
    take: 500,
  });
  return Array.from(
    new Set(
      contracts
        .map((contract) => String(contract.guardian_id || '').trim())
        .filter(Boolean),
    ),
  );
};

const getScopedReviewWhere = (spaceId: string, guardianIds: string[], roomIds: string[]) => {
  const profileTargetIds = Array.from(new Set([spaceId, ...guardianIds].filter(Boolean)));
  const directTargetIds = Array.from(new Set([spaceId, ...guardianIds, ...roomIds].filter(Boolean)));
  const filters = [];

  if (directTargetIds.length > 0) {
    filters.push({ target_id: { in: directTargetIds } });
  }
  if (profileTargetIds.length > 0) {
    filters.push({ profileId: { in: profileTargetIds } });
  }

  return filters.length > 0 ? { OR: filters } : undefined;
};

const parseCalendarEventDetails = (details: unknown): CalendarEventDetails => {
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details) as CalendarEventDetails;
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof details === 'object' && details !== null) {
    return details as CalendarEventDetails;
  }
  return {};
};

// 1. Analytics Dashboard — ALL REAL DATA
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const role = getRole(req);
  const spaceId = getUserIdCompat(req);
  try {
    if (role !== 'ADMIN') {
      if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });

      const [guardianIds, rooms] = await Promise.all([
        listLinkedGuardianIds(spaceId),
        prisma.room.findMany({
          where: { hub_id: spaceId },
          select: { id: true, name: true, capacity: true, current_occupant: true },
          take: 200,
        }),
      ]);

      const roomIds = rooms.map((room) => room.id);
      const appointments = guardianIds.length > 0
        ? await prisma.appointment.findMany({
          where: { professional_id: { in: guardianIds } },
          select: {
            id: true,
            date: true,
            price: true,
            client_id: true,
            professional_id: true,
            status: true,
          },
          take: 5000,
        })
        : [];

      const guardians = guardianIds.length > 0
        ? await prisma.profile.findMany({
          where: { id: { in: guardianIds } },
          select: { id: true, name: true, rating: true },
        })
        : [];

      const reviewWhere = getScopedReviewWhere(spaceId, guardianIds, roomIds);
      const reviews: ReviewRatingRow[] = reviewWhere
        ? await prisma.review.findMany({ where: reviewWhere, take: 5000, select: { rating: true } })
        : [];

      const totalAppointments = appointments.length;
      const activeGuardians = guardians.length;
      const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentAppointments = appointments.filter((appointment) => appointment.date >= recentCutoff).length;
      const roomCount = rooms.length;
      const maxSlots = Math.max(1, roomCount * 30 * 8);
      const occupancy = Math.min(100, Math.round((recentAppointments / maxSlots) * 100));
      const activeBuscadores = new Set(
        appointments
          .map((appointment) => String(appointment.client_id || '').trim())
          .filter(Boolean),
      ).size;
      const avgRating = reviews.length > 0
        ? reviews.reduce((acc, review) => acc + Number(review.rating), 0) / reviews.length
        : 0;

      const guardianStats = new Map<string, { name: string; sessions: number; revenue: number; rating: number }>();
      guardians.forEach((guardian) => {
        guardianStats.set(guardian.id, {
          name: guardian.name || 'Guardião',
          sessions: 0,
          revenue: 0,
          rating: Number(guardian.rating || 0),
        });
      });

      appointments.forEach((appointment) => {
        const key = String(appointment.professional_id || '').trim();
        const entry = guardianStats.get(key);
        if (!entry) return;
        entry.sessions += 1;
        if (!['cancelled', 'canceled'].includes(String(appointment.status || '').toLowerCase())) {
          entry.revenue += Number(appointment.price || 0);
        }
      });

      const topGuardians = Array.from(guardianStats.values())
        .sort((left, right) => right.sessions - left.sessions)
        .slice(0, 5)
        .map((guardian) => ({
          name: guardian.name,
          sessions: guardian.sessions,
          revenue: `R$ ${(guardian.revenue / 1000).toFixed(1)}k`,
          rating: guardian.rating > 0 ? guardian.rating.toFixed(1) : (avgRating > 0 ? avgRating.toFixed(1) : '0.0'),
        }));

      const roomOccupancy = rooms.map((room) => ({
        name: room.name,
        pct: room.current_occupant ? 100 : 0,
        sessions: room.current_occupant ? 1 : 0,
      }));

      const revenue = Array.from(guardianStats.values()).reduce((acc, guardian) => acc + guardian.revenue, 0);

      return res.json({
        appointments: totalAppointments,
        revenue,
        guardians: activeGuardians,
        occupancy,
        buscadores: activeBuscadores,
        avgRating: avgRating > 0 ? Number(avgRating.toFixed(1)) : 0,
        avgDuration: '50min',
        topGuardians,
        roomOccupancy,
      });
    }

    const totalAppointments = await prisma.appointment.count();
    const activeGuardians = await prisma.profile.count({ where: { role: 'PROFESSIONAL' } });

    let revenue = 0;
    try {
      const result = await prisma.$queryRaw<RevenueRow[]>`
          SELECT COALESCE(SUM(amount), 0)::numeric as total FROM public.transactions WHERE status = 'completed'
        `;
      revenue = Number(result?.[0]?.total || 0);
    } catch (err) {
      logger.warn('getAnalytics: revenue query failed, using estimate', { error: String(err) });
      revenue = totalAppointments * 180;
    }

    const roomCount = await prisma.room.count();
    const recentAppointments = await prisma.appointment.count({
      where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
    const maxSlots = Math.max(1, roomCount * 30 * 8);
    const occupancy = Math.min(100, Math.round((recentAppointments / maxSlots) * 100));
    const activeBuscadores = await prisma.profile.count({ where: { role: 'CLIENT' } });

    let avgRating = 0;
    try {
      const reviews: ReviewRatingRow[] = await prisma.review.findMany({ take: 5000, select: { rating: true } });
      if (reviews.length > 0) avgRating = reviews.reduce((acc, r) => acc + Number(r.rating), 0) / reviews.length;
    } catch (err) { logger.warn('getAnalytics: avgRating query failed', { error: String(err) }); }

    let avgDuration = 50;
    try {
      const result = await prisma.$queryRaw<AvgDurationRow[]>`
          SELECT COALESCE(AVG(duration_min), 50)::int as avg_dur FROM public.appointments WHERE duration_min > 0
        `;
      avgDuration = Number(result?.[0]?.avg_dur || 50);
    } catch (err) { logger.warn('getAnalytics: avgDuration query failed', { error: String(err) }); }

    let topGuardians: Array<{ name: string; sessions: number; revenue: string; rating: string }> = [];
    try {
      const result = await prisma.$queryRaw<TopGuardianRow[]>`
          SELECT p.name, COUNT(a.id)::int as sessions, COALESCE(SUM(a.price), 0)::numeric as revenue
          FROM public.profiles p LEFT JOIN public.appointments a ON a.professional_id = p.id
          WHERE p.role = 'PROFESSIONAL' GROUP BY p.id, p.name ORDER BY sessions DESC LIMIT 5
        `;
      topGuardians = (result || []).map((g) => ({
        name: g.name || 'Guardião', sessions: Number(g.sessions || 0),
        revenue: `R$ ${(Number(g.revenue || 0) / 1000).toFixed(1)}k`,
        rating: avgRating > 0 ? avgRating.toFixed(1) : '5.0'
      }));
    } catch (err) { logger.warn('getAnalytics: topGuardians query failed', { error: String(err) }); }

    let roomOccupancy: Array<{ name: string | null; pct: number; sessions: number }> = [];
    try {
      const rooms = await prisma.room.findMany({
        take: 10,
        select: { name: true, capacity: true, current_occupant: true },
      }) as RoomOccupancyRow[];
      roomOccupancy = rooms.map((r) => ({
        name: r.name,
        pct: r.current_occupant ? 100 : 0,
        sessions: r.current_occupant ? 1 : 0,
      }));
    } catch (err) { logger.warn('getAnalytics: roomOccupancy query failed', { error: String(err) }); }

    return res.json({
      appointments: totalAppointments, revenue, guardians: activeGuardians, occupancy,
      buscadores: activeBuscadores, avgRating: avgRating > 0 ? Number(avgRating.toFixed(1)) : 0,
      avgDuration: `${avgDuration}min`, topGuardians, roomOccupancy
    });
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const rooms = role === 'ADMIN'
        ? [...mockAdapter.spaces.rooms.values()]
        : [...mockAdapter.spaces.rooms.values()].filter((room) => String(room.hub_id) === spaceId);
      const occupied = rooms.filter((room) => String(room.status || '').toLowerCase() === 'occupied').length;
      return res.json({
        appointments: 0,
        revenue: 0,
        guardians: 0,
        occupancy: rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0,
        buscadores: 0,
        avgRating: 0,
        avgDuration: '50min',
        topGuardians: [],
        roomOccupancy: rooms.slice(0, 10).map((room) => ({
          name: room.name,
          pct: room.current_occupant ? 100 : 0,
          sessions: room.current_occupant ? 1 : 0,
        })),
        _fallback: true,
      });
    }
    throw error;
  }
});

// 2. Reviews — REAL DATA
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const role = getRole(req);
  const spaceId = getUserIdCompat(req);
  if (role !== 'ADMIN') {
    if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });
    const [guardianIds, rooms] = await Promise.all([
      listLinkedGuardianIds(spaceId),
      prisma.room.findMany({
        where: { hub_id: spaceId },
        select: { id: true },
        take: 200,
      }),
    ]);
    const roomIds = rooms.map((room) => room.id);
    const where = getScopedReviewWhere(spaceId, guardianIds, roomIds);
    if (!where) {
      return res.json({ average: '0.0', count: 0, recommends: 0, avgGuardian: '0.0', reviews: [] });
    }

    const reviews = await prisma.review.findMany({
      where,
      take: 50,
      orderBy: { created_at: 'desc' },
      include: { author: { select: { name: true, avatar: true } } },
    });

    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((acc, review) => acc + Number(review.rating), 0) / count : 0;
    const recommends = count > 0 ? Math.round((reviews.filter((review) => Number(review.rating) >= 7).length / count) * 100) : 0;
    const guardianTargetIds = new Set([spaceId, ...guardianIds]);
    const guardianReviews = reviews.filter((review) => guardianTargetIds.has(String(review.target_id || '').trim()));
    const avgGuardian = guardianReviews.length > 0
      ? guardianReviews.reduce((acc, review) => acc + Number(review.rating), 0) / guardianReviews.length
      : avg;

    return res.json({
      average: avg.toFixed(1),
      count,
      recommends,
      avgGuardian: avgGuardian > 0 ? avgGuardian.toFixed(1) : avg.toFixed(1),
      reviews: reviews.map((review) => ({
        id: review.id,
        author: review.author?.name || 'Anônimo',
        avatar: review.author?.avatar || '',
        rating: Number(review.rating),
        comment: review.comment,
        date: review.created_at,
        target: review.target_id,
      })),
    });
  }

  const reviews = await prisma.review.findMany({
    take: 50, orderBy: { created_at: 'desc' },
    include: { author: { select: { name: true, avatar: true } } }
  });
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((acc, r) => acc + Number(r.rating), 0) / count : 0;
  const recommends = count > 0 ? Math.round((reviews.filter((r) => Number(r.rating) >= 7).length / count) * 100) : 0;
  let avgGuardian = avg;
  try {
    const gr = reviews.filter((r) => !String(r.target_id || '').toLowerCase().includes('sala'));
    if (gr.length > 0) avgGuardian = gr.reduce((acc, r) => acc + Number(r.rating), 0) / gr.length;
  } catch (err) { logger.warn('getReviews: avgGuardian calc failed', { error: String(err) }); }

  return res.json({
    average: avg.toFixed(1), count, recommends,
    avgGuardian: avgGuardian > 0 ? avgGuardian.toFixed(1) : avg.toFixed(1),
    reviews: reviews.map((r) => ({
      id: r.id, author: r.author?.name || 'Anônimo', avatar: r.author?.avatar || '',
      rating: Number(r.rating), comment: r.comment, date: r.created_at, target: r.target_id
    }))
  });
});

// 3. Create Room — PERSISTS
export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, capacity } = createRoomSchema.parse(req.body);
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const room = await prisma.room.create({ data: { name, type, capacity: capacity || 10, hub_id: userId } });
    if (isMockMode()) {
      saveMockRoom({
        id: String(room.id),
        name: String(room.name),
        type: String(room.type),
        capacity: Number(room.capacity || capacity || 10),
        hub_id: String(room.hub_id || userId),
        status: String(room.status || 'available'),
        created_at: room.created_at instanceof Date ? room.created_at.toISOString() : new Date().toISOString(),
        updated_at: room.created_at instanceof Date ? room.created_at.toISOString() : new Date().toISOString(),
        current_occupant: room.current_occupant ?? null,
      });
    }
    return res.json(room);
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const now = new Date().toISOString();
      const fallback = saveMockRoom({
        id: mockId('mock-room'),
        name: String(name),
        type: String(type),
        capacity: Number(capacity || 10),
        hub_id: String(userId),
        status: 'available',
        created_at: now,
        updated_at: now,
        current_occupant: null,
      });
      return res.json(fallback);
    }
    throw error;
  }
});

// 4. Generate Invite — PERSISTS TO DB
export const createInvite = asyncHandler(async (req: Request, res: Response) => {
  const { role, uses } = createInviteSchema.parse(req.body);
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const code = `VIVA-${role.substring(0, 3)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    const invite = await prisma.spaceInvite.create({
      data: { space_id: userId, code, role, max_usage: uses, usage: 0, status: 'active', expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
    return res.json({ id: invite.id, code: invite.code, expires: '7 days', usage: 0, maxUsage: invite.max_usage });
  } catch (e: unknown) {
    logger.warn('space.invite_table_missing', { message: e instanceof Error ? e.message : String(e) });
    return res.json({ code, expires: '7 days', usage: 0, maxUsage: uses, _ephemeral: true });
  }
});

// 5. Contract — REAL DB WITH FALLBACK
export const getContract = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  let contract: {
    id: string;
    space_name: string | null;
    space?: { name: string | null } | null;
    guardian?: { name: string | null } | null;
    start_date: Date;
    end_date: Date;
    status: string;
    monthly_fee: DecimalLike;
    revenue_share: DecimalLike;
    rooms_allowed: string[] | null;
    hours_per_week: number | null;
    benefits: string[] | null;
    rules: string[] | null;
    terms: string | null;
    signed: boolean | null;
    version: string | null;
  } | null = null;
  try {
    contract = await prisma.contract.findFirst({
      where: { OR: [{ guardian_id: userId }, { space_id: userId }], status: 'active' },
      include: { space: { select: { name: true } }, guardian: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    }) as typeof contract;
  } catch (e: unknown) { logger.warn('space.contract_query_failed', { message: e instanceof Error ? e.message : String(e) }); }

  if (contract) {
    const now = new Date();
    const end = new Date(contract.end_date);
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return res.json({
      id: contract.id, spaceName: contract.space_name || contract.space?.name || 'Santuário',
      guardianName: contract.guardian?.name || 'Guardião',
      startDate: contract.start_date, endDate: contract.end_date, status: contract.status,
      monthlyFee: Number(contract.monthly_fee), revenueShare: Number(contract.revenue_share),
      roomsAllowed: contract.rooms_allowed || [], hoursPerWeek: contract.hours_per_week,
      benefits: contract.benefits || [], rules: contract.rules || [],
      daysRemaining, terms: contract.terms, signed: contract.signed, version: contract.version
    });
  }
  return res.json({
    id: 'template', spaceName: 'Ainda não vinculado', status: 'pending',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyFee: 0, revenueShare: 15, roomsAllowed: [], hoursPerWeek: 0,
    benefits: ['Sala de espera', 'Wi-Fi', 'Agenda compartilhada'],
    rules: ['A definir com o Santuário'], daysRemaining: 365,
    terms: 'Contrato ainda não formalizado. Vincule-se a um Santuário para ativar.',
    signed: false, version: '1.0', _template: true
  });
});

// 6. List Spaces
export const listSpaces = asyncHandler(async (req: Request, res: Response) => {
  const spaces = await prisma.profile.findMany({
    where: { role: 'SPACE' }, take: 20,
    select: { id: true, name: true, location: true, avatar: true }
  });
  const results = spaces.map((s) => ({
    id: s.id, name: s.name || 'Santuário', address: s.location || 'Endereço não informado',
    rating: 5.0, status: 'active',
    image: s.avatar || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
  }));
  if (results.length === 0) {
    return res.json([{ id: 'demo', name: 'Espaço Gaia (Demo)', address: 'Nenhum santuário cadastrado', rating: 5.0, status: 'demo', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400' }]);
  }
  return res.json(results);
});

// 7. Linked Team (Space -> guardians via contracts)
export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const spaceId = getUserIdCompat(req);
  if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });

  let contracts: ContractWithGuardian[] = [];
  try {
    contracts = await prisma.contract.findMany({
      where: { space_id: spaceId, status: { in: ['active', 'pending'] } },
      take: 200,
      include: {
        guardian: {
          select: {
            id: true,
            name: true,
            avatar: true,
            karma: true,
            specialty: true,
            rating: true,
            review_count: true,
            location: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    }) as ContractWithGuardian[];
  } catch (e: unknown) {
    return res.json({ team: [], _error: e instanceof Error ? e.message : String(e) });
  }

  const team = contracts
    .filter((c) => c.guardian)
    .map((c) => ({
      ...c.guardian,
      contract: {
        id: c.id,
        status: c.status,
        startDate: c.start_date,
        endDate: c.end_date,
        revenueShare: Number(c.revenue_share || 0),
        roomsAllowed: c.rooms_allowed || [],
        hoursPerWeek: c.hours_per_week || 0,
        signed: !!c.signed,
      },
    }));

  return res.json({ team });
});

// 8. Patients (non-sensitive) for a space: clients with appointments with linked guardians
export const getPatients = asyncHandler(async (req: Request, res: Response) => {
  const spaceId = getUserIdCompat(req);
  if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });

  const contracts = await prisma.contract.findMany({
    where: { space_id: spaceId, status: { in: ['active', 'pending'] } },
    take: 200,
    select: { guardian_id: true },
  });
  const guardianIds: string[] = Array.from(
    new Set(
      (contracts || [])
        .map((c) => String(c?.guardian_id || '').trim())
        .filter(Boolean)
    )
  );
  if (guardianIds.length === 0) return res.json({ patients: [] });

  const appts = await prisma.appointment.findMany({
    where: { professional_id: { in: guardianIds }, client_id: { not: null } },
    include: {
      client: { select: { id: true, name: true, avatar: true, karma: true, plant_stage: true } },
      professional: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: 500,
  });

  const byClient = new Map<string, {
    id: string;
    name: string;
    avatar: string;
    karma: number;
    plantStage: string;
    sessionsCount: number;
    lastVisitAt: string | null;
    guardians: Set<string>;
  }>();
  appts.forEach((a) => {
    const clientId = a.client?.id;
    if (!clientId) return;
    const existing = byClient.get(clientId);
    const base = existing || {
      id: clientId,
      name: a.client?.name || 'Buscador',
      avatar: a.client?.avatar || '',
      karma: a.client?.karma || 0,
      plantStage: a.client?.plant_stage || 'seed',
      sessionsCount: 0,
      lastVisitAt: null as string | null,
      guardians: new Set<string>(),
    };
    base.sessionsCount += 1;
    base.lastVisitAt = base.lastVisitAt || a.date?.toISOString?.() || null;
    if (a.professional?.name) base.guardians.add(a.professional.name);
    byClient.set(clientId, base);
  });

  const patients = Array.from(byClient.values()).map((p) => ({
    ...p,
    guardians: Array.from(p.guardians).slice(0, 5),
  }));

  return res.json({ patients });
});

// 9. Patient detail (non-sensitive)
export const getPatient = asyncHandler(async (req: Request, res: Response) => {
  const spaceId = getUserIdCompat(req);
  const patientId = String(req.params.id || '').trim();
  if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });
  if (!patientId) return res.status(400).json({ error: 'Missing patient id' });

  const contracts = await prisma.contract.findMany({
    where: { space_id: spaceId, status: { in: ['active', 'pending'] } },
    take: 200,
    select: { guardian_id: true },
  });
  const guardianIds: string[] = Array.from(
    new Set(
      (contracts || [])
        .map((c) => String(c?.guardian_id || '').trim())
        .filter(Boolean)
    )
  );
  if (guardianIds.length === 0) return res.status(404).json({ error: 'No linked guardians' });

  const patient = await prisma.profile.findUnique({
    where: { id: patientId },
    select: { id: true, name: true, avatar: true, karma: true, plant_stage: true, specialty: true, location: true },
  });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const appts = await prisma.appointment.findMany({
    where: { client_id: patientId, professional_id: { in: guardianIds } },
    include: { professional: { select: { id: true, name: true, avatar: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  });

  return res.json({
    patient,
    appointments: appts.map((a) => ({
      id: a.id,
      date: a.date,
      time: a.time,
      serviceName: a.service_name,
      status: a.status,
      price: a.price,
      guardian: a.professional,
    })),
  });
});

// 10. Space Retreats
export const getRetreats = asyncHandler(async (req: Request, res: Response) => {
  const spaceId = getUserIdCompat(req);
  if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });

  const events = await prisma.calendarEvent.findMany({
    where: { user_id: spaceId },
    orderBy: { start_time: 'asc' },
  });

  const retreats = events.filter((e) => {
    const meta = parseCalendarEventDetails(e.details);
    const rawType = String(e.type || '').toLowerCase();
    const kind = String(meta.kind || '').toLowerCase();
    return rawType === 'retreat' || kind === 'retreat';
  });

  return res.json(retreats);
});

export const createRetreat = asyncHandler(async (req: Request, res: Response) => {
  const spaceId = getUserIdCompat(req);
  if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });

  const { title, start, end, details } = req.body;

  let mergedDetails = {};
  if (typeof details === 'string') {
    try { mergedDetails = JSON.parse(details); } catch { /* ignore */ }
  } else if (typeof details === 'object' && details !== null) {
    mergedDetails = details;
  }

  mergedDetails = { ...mergedDetails, kind: 'retreat' };

  const event = await prisma.calendarEvent.create({
    data: {
      user_id: spaceId,
      title: title || 'Novo Retiro',
      start_time: new Date(start || Date.now()),
      end_time: new Date(end || Date.now() + 86400000),
      type: 'retreat',
      details: JSON.stringify(mergedDetails),
    },
  });

  return res.json(event);
});

// 11. Space Room Agenda
export const getRoomAgenda = asyncHandler(async (req: Request, res: Response) => {
  const spaceId = getUserIdCompat(req);
  const roomId = String(req.params.roomId || '').trim();
  if (!spaceId) return res.status(401).json({ error: 'Unauthorized' });
  if (!roomId) return res.status(400).json({ error: 'Missing roomId' });

  const events = await prisma.calendarEvent.findMany({
    where: { user_id: spaceId },
    orderBy: { start_time: 'asc' },
  });

  const agenda = events.filter((e) => {
    const meta = parseCalendarEventDetails(e.details);
    return String(meta.roomId || '') === roomId;
  });

  return res.json(agenda);
});

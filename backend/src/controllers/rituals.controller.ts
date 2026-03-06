import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import prisma from '../lib/prisma';
import { AuthUser } from '../middleware/auth.middleware';

type RoutineStep = {
    id: string;
    title: string;
    duration: number;
    icon: string;
    completed?: boolean;
};

type AuthenticatedRequest = Request & {
    user?: AuthUser;
};

type RoutineInputStep = Partial<RoutineStep>;

const DEFAULT_ROUTINES: Record<string, RoutineStep[]> = {
    morning: [
        { id: '1', title: 'Agua com Limao', duration: 5, icon: 'Droplets', completed: false },
        { id: '2', title: 'Meditacao Solar', duration: 10, icon: 'Sun', completed: false },
    ],
    night: [
        { id: '3', title: 'Banho de Ervas', duration: 20, icon: 'Bath', completed: false },
        { id: '4', title: 'Leitura', duration: 15, icon: 'Book', completed: false },
    ],
};

export const getRoutine = asyncHandler(async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const userId = request.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const routineType = ((req.query.type as string) || req.params.period || 'morning').toLowerCase();

    const record = await prisma.routine.findUnique({
        where: { user_id_type: { user_id: userId, type: routineType } },
    });

    if (record) {
        return res.json(record.steps);
    }

    // Return defaults (not persisted until user saves)
    return res.json(DEFAULT_ROUTINES[routineType] || []);
});

export const saveRoutine = asyncHandler(async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const userId = request.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const { type, period, steps, data } = req.body || {};
    const routineType = String(type || period || req.params.period || '').toLowerCase();
    const routineSteps: RoutineStep[] = Array.isArray(steps) ? steps : (Array.isArray(data) ? data : []);

    if (!routineType || routineSteps.length === 0) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const sanitizedSteps = routineSteps.map((step: RoutineInputStep, idx: number) => ({
        id: String(step?.id || `${idx + 1}`),
        title: String(step?.title || `Ritual ${idx + 1}`),
        duration: Number(step?.duration || 5),
        icon: String(step?.icon || 'Sparkles'),
        completed: Boolean(step?.completed),
    }));

    await prisma.routine.upsert({
        where: { user_id_type: { user_id: userId, type: routineType } },
        create: { user_id: userId, type: routineType, steps: sanitizedSteps },
        update: { steps: sanitizedSteps },
    });

    logger.info('rituals: routine saved to DB', { userId, routineType, steps: sanitizedSteps.length });
    return res.json({ success: true, message: 'Ritual cristalizado com sucesso.' });
});

export const toggleRoutine = asyncHandler(async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const userId = request.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const { period, id } = req.params;
    const routineType = String(period || 'morning').toLowerCase();

    const record = await prisma.routine.findUnique({
        where: { user_id_type: { user_id: userId, type: routineType } },
    });

    const current: RoutineStep[] = (record?.steps as RoutineStep[]) || DEFAULT_ROUTINES[routineType] || [];
    let updated: RoutineStep | null = null;

    const newSteps = current.map((step) => {
        if (step.id !== id) return step;
        updated = { ...step, completed: !step.completed };
        return updated;
    });

    if (!updated) {
        return res.status(404).json({ error: 'Ritual step not found' });
    }

    await prisma.routine.upsert({
        where: { user_id_type: { user_id: userId, type: routineType } },
        create: { user_id: userId, type: routineType, steps: newSteps },
        update: { steps: newSteps },
    });

    return res.json({ success: true, step: updated });
});

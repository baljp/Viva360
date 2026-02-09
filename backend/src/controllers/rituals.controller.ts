import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';

type RoutineStep = {
    id: string;
    title: string;
    duration: number;
    icon: string;
    completed?: boolean;
};

const createDefaultRoutines = (): Record<string, RoutineStep[]> => ({
    morning: [
        { id: '1', title: 'Agua com Limao', duration: 5, icon: 'Droplets', completed: false },
        { id: '2', title: 'Meditacao Solar', duration: 10, icon: 'Sun', completed: false },
    ],
    night: [
        { id: '3', title: 'Banho de Ervas', duration: 20, icon: 'Bath', completed: false },
        { id: '4', title: 'Leitura', duration: 15, icon: 'Book', completed: false },
    ],
});

const ROUTINES_BY_USER: Record<string, Record<string, RoutineStep[]>> = {};

const resolveUserRoutines = (userId: string) => {
    if (!ROUTINES_BY_USER[userId]) {
        ROUTINES_BY_USER[userId] = createDefaultRoutines();
    }
    return ROUTINES_BY_USER[userId];
};

export const getRoutine = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'default-user';
    const { type } = req.query;
    const routineType = ((type as string) || req.params.period || 'morning').toLowerCase();
    const routines = resolveUserRoutines(userId);

    return res.json(routines[routineType] || []);
});

export const saveRoutine = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'default-user';
    const { type, period, steps, data } = req.body || {};
    const routineType = String(type || period || req.params.period || '').toLowerCase();
    const routineSteps = Array.isArray(steps) ? steps : (Array.isArray(data) ? data : []);

    if (!routineType || routineSteps.length === 0) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const routines = resolveUserRoutines(userId);
    routines[routineType] = routineSteps.map((step: any, idx: number) => ({
        id: String(step?.id || `${idx + 1}`),
        title: String(step?.title || `Ritual ${idx + 1}`),
        duration: Number(step?.duration || 5),
        icon: String(step?.icon || 'Sparkles'),
        completed: Boolean(step?.completed),
    }));

    return res.json({ success: true, message: 'Ritual cristalizado com sucesso.' });
});

export const toggleRoutine = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'default-user';
    const { period, id } = req.params;
    const routineType = String(period || 'morning').toLowerCase();
    const routines = resolveUserRoutines(userId);
    const current = routines[routineType] || [];

    let updated: RoutineStep | null = null;
    routines[routineType] = current.map((step) => {
        if (step.id !== id) return step;
        updated = { ...step, completed: !step.completed };
        return updated;
    });

    if (!updated) {
        return res.status(404).json({ error: 'Ritual step not found' });
    }

    return res.json({ success: true, step: updated });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleRoutine = exports.saveRoutine = exports.getRoutine = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const createDefaultRoutines = () => ({
    morning: [
        { id: '1', title: 'Agua com Limao', duration: 5, icon: 'Droplets', completed: false },
        { id: '2', title: 'Meditacao Solar', duration: 10, icon: 'Sun', completed: false },
    ],
    night: [
        { id: '3', title: 'Banho de Ervas', duration: 20, icon: 'Bath', completed: false },
        { id: '4', title: 'Leitura', duration: 15, icon: 'Book', completed: false },
    ],
});
const ROUTINES_BY_USER = {};
const resolveUserRoutines = (userId) => {
    if (!ROUTINES_BY_USER[userId]) {
        ROUTINES_BY_USER[userId] = createDefaultRoutines();
    }
    return ROUTINES_BY_USER[userId];
};
exports.getRoutine = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || 'default-user';
    const { type } = req.query;
    const routineType = (type || req.params.period || 'morning').toLowerCase();
    const routines = resolveUserRoutines(userId);
    return res.json(routines[routineType] || []);
});
exports.saveRoutine = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || 'default-user';
    const { type, period, steps, data } = req.body || {};
    const routineType = String(type || period || req.params.period || '').toLowerCase();
    const routineSteps = Array.isArray(steps) ? steps : (Array.isArray(data) ? data : []);
    if (!routineType || routineSteps.length === 0) {
        return res.status(400).json({ error: 'Missing data' });
    }
    const routines = resolveUserRoutines(userId);
    routines[routineType] = routineSteps.map((step, idx) => ({
        id: String(step?.id || `${idx + 1}`),
        title: String(step?.title || `Ritual ${idx + 1}`),
        duration: Number(step?.duration || 5),
        icon: String(step?.icon || 'Sparkles'),
        completed: Boolean(step?.completed),
    }));
    return res.json({ success: true, message: 'Ritual cristalizado com sucesso.' });
});
exports.toggleRoutine = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || 'default-user';
    const { period, id } = req.params;
    const routineType = String(period || 'morning').toLowerCase();
    const routines = resolveUserRoutines(userId);
    const current = routines[routineType] || [];
    let updated = null;
    routines[routineType] = current.map((step) => {
        if (step.id !== id)
            return step;
        updated = { ...step, completed: !step.completed };
        return updated;
    });
    if (!updated) {
        return res.status(404).json({ error: 'Ritual step not found' });
    }
    return res.json({ success: true, step: updated });
});

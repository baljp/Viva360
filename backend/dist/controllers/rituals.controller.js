"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRoutine = exports.getRoutine = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
// In-memory storage for demo purposes until Schema update
let MOCK_ROUTINES = {
    'morning': [
        { id: '1', title: 'Água com Limão', duration: 5, icon: 'Droplets' },
        { id: '2', title: 'Meditação Solar', duration: 10, icon: 'Sun' }
    ],
    'night': [
        { id: '3', title: 'Banho de Ervas', duration: 20, icon: 'Bath' },
        { id: '4', title: 'Leitura', duration: 15, icon: 'Book' }
    ]
};
exports.getRoutine = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { type } = req.query; // 'morning' | 'night'
    const routineType = type || 'morning';
    return res.json(MOCK_ROUTINES[routineType] || []);
});
exports.saveRoutine = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { type, steps } = req.body;
    if (!type || !steps)
        return res.status(400).json({ error: 'Missing data' });
    MOCK_ROUTINES[type] = steps;
    return res.json({ success: true, message: 'Ritual cristalizado com sucesso.' });
});

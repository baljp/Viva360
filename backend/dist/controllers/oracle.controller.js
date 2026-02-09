"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToday = exports.getHistory = exports.drawCard = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const oracle_service_1 = require("../services/oracle.service");
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
// Mock DB/Service calls for context until authentic User/Profile services are fully typed/linked
const getUserContext = async (userId, moodBody) => {
    // In real app, fetch from Profile/GardenService
    return {
        mood: moodBody || 'sereno',
        gardenStatus: { health: 80, waterNeeded: false }, // Mock
        metamorphosisPhase: 'germinacao' // Mock
    };
};
exports.drawCard = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || DEFAULT_USER_ID; // Fallback for dev
    const { mood } = req.body;
    // Simulate "shuffling" delay for UX
    await new Promise(r => setTimeout(r, 1500));
    const context = await getUserContext(userId, mood);
    const card = await oracle_service_1.oracleService.drawCard(userId, context);
    if (!card) {
        return res.status(503).json({ error: 'Oráculo temporariamente indisponível.' });
    }
    return res.json({
        drawId: Date.now().toString(),
        card: {
            id: card.id,
            name: 'Oráculo Viva360', // Generic title or from Category
            insight: card.text || card.message,
            element: card.element,
            intensity: 'Média', // Could calculate based on depth
            category: card.category
        },
        drawnAt: new Date().toISOString(),
        moodContext: mood || 'neutral'
    });
});
exports.getHistory = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || DEFAULT_USER_ID;
    const history = await oracle_service_1.oracleService.getHistory(userId);
    return res.json(history.map((entry) => ({
        drawId: entry.id,
        drawnAt: entry.drawn_at,
        card: {
            id: entry.message.id,
            name: 'Oráculo Viva360',
            insight: entry.message.text,
            element: entry.message.element,
            category: entry.message.category,
        },
        context: entry.context,
    })));
});
exports.getToday = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || DEFAULT_USER_ID;
    const card = await oracle_service_1.oracleService.getToday(userId);
    if (!card) {
        return res.status(404).json({ error: 'Nenhuma carta revelada hoje ainda.' });
    }
    return res.json({
        card: {
            id: card.id,
            name: 'Guia Diário',
            insight: card.text || card.message,
            element: card.element
        }
    });
});

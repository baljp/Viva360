"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToday = exports.getHistory = exports.drawCard = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const oracle_service_1 = require("../services/oracle.service");
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
    const userId = req.user?.userId || 'mock-user-id'; // Fallback for dev
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
// History endpoint to be implemented with real OracleHistory model
exports.getHistory = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    // Mock return for now
    return res.json([]);
});
exports.getToday = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || 'mock-user-id';
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

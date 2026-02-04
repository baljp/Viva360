"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvolution = exports.checkIn = void 0;
const determinism_1 = require("../lib/determinism");
const queue_1 = require("../queue");
const supabase_service_1 = require("../services/supabase.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const cloudinary_service_1 = require("../services/cloudinary.service");
const async_middleware_1 = require("../middleware/async.middleware");
// In-memory mock DB
const METAMORPHOSIS_DB = {};
exports.checkIn = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { mood, photoHash, photoThumb } = req.body;
    if (!mood)
        return res.status(400).json({ error: 'Mood is required' });
    // Asset Optimization: Upload to CDN
    const optimizedPhotoUrl = photoThumb ? await cloudinary_service_1.CloudinaryService.uploadImage(photoThumb) : null;
    // 1. Retrieve History
    const userHistory = METAMORPHOSIS_DB[userId] || [];
    const recentMoods = userHistory.map(h => h.mood);
    // 2. Run Deterministic Engine
    const recommendation = determinism_1.DeterministicEngine.process(mood, recentMoods);
    // 3. Persist
    const entry = {
        id: Date.now().toString(),
        userId,
        timestamp: new Date().toISOString(),
        mood,
        photoHash,
        photoThumb: optimizedPhotoUrl,
        ...recommendation
    };
    if (!METAMORPHOSIS_DB[userId])
        METAMORPHOSIS_DB[userId] = [];
    METAMORPHOSIS_DB[userId].push(entry);
    // PERSISTENCE (Non-Mock)
    if (!(0, supabase_service_1.isMockMode)()) {
        await prisma_1.default.$transaction(async (tx) => {
            // 1. Create Event
            await tx.event.create({
                data: {
                    stream_id: userId,
                    type: 'MOOD_LOGGED',
                    payload: entry
                }
            });
            // 2. Upsert Projection
            await tx.metamorphosisProjection.upsert({
                where: { user_id: userId },
                create: {
                    user_id: userId,
                    total_checkins: 1,
                    last_mood: mood,
                    evolution_score: 10
                },
                update: {
                    total_checkins: { increment: 1 },
                    last_mood: mood,
                    evolution_score: { increment: 10 }
                }
            });
        });
    }
    // ASYNC
    queue_1.logsQueue.add('emotional_log', entry).catch(err => console.error('Queue Error:', err));
    return res.json({ success: true, entry });
});
exports.getEvolution = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { days } = req.query;
    if ((0, supabase_service_1.isMockMode)()) {
        const userHistory = METAMORPHOSIS_DB[userId] || [];
        return res.json({
            entries: userHistory,
            totalEntries: userHistory.length,
            lastMood: userHistory[userHistory.length - 1]?.mood || 'Neutral',
            streak: 3,
            evolutionScore: 850,
            readFrom: 'In-Memory Store (Mock)'
        });
    }
    const [projection, events] = await Promise.all([
        prisma_1.default.metamorphosisProjection.findUnique({
            where: { user_id: userId }
        }),
        prisma_1.default.event.findMany({
            where: { stream_id: userId, type: 'MOOD_LOGGED' },
            orderBy: { created_at: 'desc' },
            take: 20
        })
    ]);
    if (!projection && events.length === 0) {
        return res.json({
            entries: [],
            totalEntries: 0,
            evolutionScore: 0,
            note: "No projection found yet (async processing)"
        });
    }
    const entries = events.map(e => ({
        id: e.id,
        timestamp: e.created_at,
        mood: e.payload.mood,
        quote: e.payload.quote,
        reflection: e.payload.reflection,
        photoThumb: e.payload.photoThumb
    }));
    return res.json({
        entries,
        totalEntries: projection?.total_checkins || entries.length,
        lastMood: projection?.last_mood || entries[0]?.mood,
        streak: projection?.streak_days || 1,
        evolutionScore: projection?.evolution_score || 0,
        readFrom: 'DB (Events + Projection)'
    });
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvolution = exports.checkIn = void 0;
const determinism_1 = require("../lib/determinism");
const queue_1 = require("../queue");
// In-memory mock DB for check-ins (LGPD: Photos stored on client, we keep hashes)
// Structure: { userId: [ { date: 'ISO', mood: 'Happry', photoHash: 'abc', quote: '...' } ] }
const METAMORPHOSIS_DB = {};
const checkIn = async (req, res) => {
    const userId = req.user?.userId;
    const { mood, photoHash, photoThumb } = req.body;
    if (!mood)
        return res.status(400).json({ error: 'Mood is required' });
    // 1. Retrieve History
    const userHistory = METAMORPHOSIS_DB[userId] || [];
    const recentMoods = userHistory.map(h => h.mood);
    // 2. Run Deterministic Engine
    const recommendation = determinism_1.DeterministicEngine.process(mood, recentMoods);
    // 3. Persist (Privacy First: No full photos)
    const entry = {
        id: Date.now().toString(),
        userId, // Critical for Event Sourcing aggregation
        timestamp: new Date().toISOString(),
        mood,
        photoHash, // Proof of photo
        photoThumb, // Low res for timeline
        ...recommendation
    };
    if (!METAMORPHOSIS_DB[userId])
        METAMORPHOSIS_DB[userId] = [];
    METAMORPHOSIS_DB[userId].push(entry);
    // ASYNC ARCHITECTURE (Phase 1)
    // Dispatch to queue for async processing (e.g. analytics, long-term storage)
    queue_1.logsQueue.add('emotional_log', entry).catch(err => console.error('Queue Error:', err));
    // 4. Return Instant Feedback
    return res.json({
        success: true,
        entry
    });
};
exports.checkIn = checkIn;
// Imports needing update at top of file, but tool limits contiguous block. 
// Assuming this block replaces getEvolution implementation:
const getEvolution = async (req, res) => {
    const userId = req.user?.userId;
    const { days } = req.query;
    // CQRS Query Side (Phase 3)
    // Read from materialized view (Projection) instead of aggregating raw data
    const prisma = (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).default;
    const projection = await prisma.metamorphosisProjection.findUnique({
        where: { user_id: userId }
    });
    if (!projection) {
        return res.json({
            entries: [],
            totalEntries: 0,
            evolutionScore: 0,
            note: "No projection found yet (async processing)"
        });
    }
    return res.json({
        totalEntries: projection.total_checkins,
        lastMood: projection.last_mood,
        streak: projection.streak_days,
        evolutionScore: projection.evolution_score,
        // For detailed list we might still query Event store or a separate read model, 
        // but for summary stats we use projection.
        readFrom: 'MetamorphosisProjection (Materialized View)'
    });
};
exports.getEvolution = getEvolution;

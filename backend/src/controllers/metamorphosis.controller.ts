import { Request, Response } from 'express';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { logsQueue } from '../queue';

// In-memory mock DB for check-ins (LGPD: Photos stored on client, we keep hashes)
// Structure: { userId: [ { date: 'ISO', mood: 'Happry', photoHash: 'abc', quote: '...' } ] }
const METAMORPHOSIS_DB: Record<string, any[]> = {};

export const checkIn = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { mood, photoHash, photoThumb } = req.body;

    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    // 1. Retrieve History
    const userHistory = METAMORPHOSIS_DB[userId] || [];
    const recentMoods = userHistory.map(h => h.mood);

    // 2. Run Deterministic Engine
    const recommendation = DeterministicEngine.process(mood as Mood, recentMoods);

    // 3. Persist (Privacy First: No full photos)
    const entry = {
        id: Date.now().toString(),
        userId, // Critical for Event Sourcing aggregation
        timestamp: new Date().toISOString(),
        mood,
        photoHash,   // Proof of photo
        photoThumb,  // Low res for timeline
        ...recommendation
    };

    if (!METAMORPHOSIS_DB[userId]) METAMORPHOSIS_DB[userId] = [];
    METAMORPHOSIS_DB[userId].push(entry);

    // ASYNC ARCHITECTURE (Phase 1)
    // Dispatch to queue for async processing (e.g. analytics, long-term storage)
    logsQueue.add('emotional_log', entry).catch(err => console.error('Queue Error:', err));

    // 4. Return Instant Feedback
    return res.json({
        success: true,
        entry
    });
};

// Imports needing update at top of file, but tool limits contiguous block. 
// Assuming this block replaces getEvolution implementation:

export const getEvolution = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { days } = req.query; 

    // CQRS Query Side (Phase 3)
    // Read from materialized view (Projection) instead of aggregating raw data
    const prisma = (await import('../lib/prisma')).default;

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

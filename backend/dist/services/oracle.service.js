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
exports.oracleService = exports.OracleService = void 0;
const prisma_1 = __importStar(require("../lib/prisma"));
class OracleService {
    constructor() {
        this.fallbackUserId = '00000000-0000-0000-0000-000000000001';
        this.uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    }
    // Core Algorithm: Select the best card based on context
    async drawCard(userId, context) {
        const safeUserId = this.normalizeUserId(userId);
        // 1. Fetch Candidate Messages (Filtered by basic rules)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const recentHistory = await prisma_1.prismaRead.oracleHistory.findMany({
            where: {
                user_id: safeUserId,
                drawn_at: { gte: sixtyDaysAgo }
            },
            select: { message_id: true }
        });
        const recentMessageIds = recentHistory.map(h => h.message_id);
        const normalizedMood = this.normalizeMood(context.mood);
        const candidates = await prisma_1.prismaRead.oracleMessage.findMany({
            where: {
                id: { notIn: recentMessageIds },
                OR: [
                    { moods: { has: normalizedMood } },
                    { moods: { has: context.mood } },
                    { phases: { has: context.metamorphosisPhase } },
                    { category: 'consciencia' },
                    { element: this.getElementForMood(normalizedMood) }
                ]
            }
        });
        if (candidates.length === 0) {
            return this.getRandomFallback();
        }
        // 2. Score Candidates
        const scoredCandidates = candidates.map(card => {
            let score = 0;
            // A. Mood Match (30%)
            if (card.moods.includes(normalizedMood) || card.moods.includes(context.mood))
                score += 30;
            // B. Garden/Element Match (25%)
            const targetElement = context.gardenStatus.waterNeeded ? 'Agua' : 'Terra';
            if (card.element === targetElement)
                score += 25;
            // C. Metamorphosis Phase (20%)
            if (card.phases.includes(context.metamorphosisPhase))
                score += 20;
            // D. Weight/Rarity Adjustment
            score *= Number(card.weight);
            // E. Random noise for variety
            score += Math.random() * 10;
            return { card, score };
        });
        // 3. Select Winner
        scoredCandidates.sort((a, b) => b.score - a.score);
        const winner = scoredCandidates[0].card;
        // 4. Record History
        try {
            await prisma_1.default.oracleHistory.create({
                data: {
                    user_id: safeUserId,
                    message_id: winner.id,
                    context: context
                }
            });
        }
        catch (e) {
            // Do not block card reveal if history persistence fails.
            console.warn('Oracle history persistence failed:', e);
        }
        return winner;
    }
    async getToday(userId) {
        const safeUserId = this.normalizeUserId(userId);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const lastDraw = await prisma_1.prismaRead.oracleHistory.findFirst({
            where: {
                user_id: safeUserId,
                drawn_at: { gte: startOfDay }
            },
            include: {
                message: true
            },
            orderBy: {
                drawn_at: 'desc'
            }
        });
        return lastDraw?.message || null;
    }
    async getHistory(userId, limit = 30) {
        const safeUserId = this.normalizeUserId(userId);
        return prisma_1.prismaRead.oracleHistory.findMany({
            where: { user_id: safeUserId },
            include: { message: true },
            orderBy: { drawn_at: 'desc' },
            take: limit,
        });
    }
    normalizeUserId(userId) {
        if (!userId)
            return this.fallbackUserId;
        return this.uuidRegex.test(userId) ? userId : this.fallbackUserId;
    }
    normalizeMood(mood) {
        const mapping = {
            'anxious': 'ansioso',
            'sad': 'triste',
            'tired': 'cansado',
            'focused': 'focado',
            'happy': 'feliz',
            'motivated': 'motivado'
        };
        return mapping[mood?.toLowerCase()] || mood?.toLowerCase() || 'neutral';
    }
    getElementForMood(mood) {
        switch (mood) {
            case 'ansioso': return 'Agua';
            case 'triste': return 'Fogo';
            case 'cansado': return 'Terra';
            case 'focado': return 'Ar';
            default: return 'Ar';
        }
    }
    async getRandomFallback() {
        try {
            const count = await prisma_1.prismaRead.oracleMessage.count();
            if (count === 0)
                return null;
            const skip = Math.floor(Math.random() * count);
            const [card] = await prisma_1.prismaRead.oracleMessage.findMany({ take: 1, skip });
            return card || null;
        }
        catch (e) {
            console.error('Fallback error:', e);
            return null;
        }
    }
}
exports.OracleService = OracleService;
exports.oracleService = new OracleService();

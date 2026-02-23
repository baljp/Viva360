import prisma, { prismaRead } from '../lib/prisma';
import { OracleMessage } from '@prisma/client';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

interface OracleContext {
    mood: string;
    gardenStatus: { health: number; waterNeeded: boolean };
    metamorphosisPhase: string;
}

export class OracleService {
    private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    private readonly fallbackDeck: OracleMessage[] = [
        {
            id: '11111111-1111-4111-8111-111111111111',
            text: 'Aquiete o peito. A resposta nasce no silencio entre dois respiros.',
            category: 'consciencia',
            element: 'Ar',
            moods: ['neutral', 'focado', 'ansioso'],
            phases: ['inicio', 'crescimento'],
            depth: 1,
            weight: 1 as any,
            rarity: 'common',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
            id: '22222222-2222-4222-8222-222222222222',
            text: 'Onde houver excesso, escolha delicadeza. Forca tambem pode ser suave.',
            category: 'cura_emocional',
            element: 'Agua',
            moods: ['triste', 'ansioso', 'cansado'],
            phases: ['inicio', 'integracao'],
            depth: 1,
            weight: 1 as any,
            rarity: 'common',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
            id: '33333333-3333-4333-8333-333333333333',
            text: 'Seu proximo passo nao precisa ser grande. Precisa ser verdadeiro.',
            category: 'acao_foco',
            element: 'Terra',
            moods: ['focado', 'motivado', 'neutral'],
            phases: ['crescimento', 'expansao'],
            depth: 1,
            weight: 1 as any,
            rarity: 'common',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
        },
    ];

    // Core Algorithm: Select the best card based on context
    async drawCard(userId: string, context: OracleContext): Promise<OracleMessage | null> {
        const safeUserId = this.normalizeUserId(userId);
        const normalizedMood = this.normalizeMood(context.mood);

        let candidates: OracleMessage[] = [];
        try {
            // 1. Fetch Candidate Messages (Filtered by basic rules)
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const recentHistory = await prismaRead.oracleHistory.findMany({
                where: {
                    user_id: safeUserId,
                    drawn_at: { gte: sixtyDaysAgo }
                },
                take: 100,
                select: { message_id: true }
            });

            const recentMessageIds = recentHistory.map(h => h.message_id);

            candidates = await prismaRead.oracleMessage.findMany({
                where: {
                    id: { notIn: recentMessageIds },
                    OR: [
                        { moods: { has: normalizedMood } },
                        { moods: { has: context.mood } },
                        { phases: { has: context.metamorphosisPhase } },
                        { category: 'consciencia' },
                        { element: this.getElementForMood(normalizedMood) }
                    ]
                },
                take: 200
            });
        } catch (error) {
            if (this.isSafeFallbackRuntime() && this.isDbUnavailableError(error)) {
                return this.getFallbackByContext(normalizedMood);
            }
            throw error;
        }

        if (candidates.length === 0) {
            return this.getRandomFallback();
        }

        // 2. Score Candidates
        const scoredCandidates = candidates.map(card => {
            let score = 0;

            // A. Mood Match (30%)
            if (card.moods.includes(normalizedMood) || card.moods.includes(context.mood)) score += 30;

            // B. Garden/Element Match (25%)
            const targetElement = context.gardenStatus.waterNeeded ? 'Agua' : 'Terra';
            if (card.element === targetElement) score += 25;

            // C. Metamorphosis Phase (20%)
            if (card.phases.includes(context.metamorphosisPhase)) score += 20;

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
            await prisma.oracleHistory.create({
                data: {
                    user_id: safeUserId,
                    message_id: winner.id,
                    context: context as any
                }
            });
        } catch (e) {
            // Do not block card reveal if history persistence fails.
            logger.warn('oracle.history_persist_failed', e);
        }

        return winner;
    }

    async getToday(userId: string) {
        const safeUserId = this.normalizeUserId(userId);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        try {
            const lastDraw = await prismaRead.oracleHistory.findFirst({
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
        } catch (error) {
            if (this.isSafeFallbackRuntime() && this.isDbUnavailableError(error)) {
                return this.getFallbackByContext('neutral');
            }
            throw error;
        }
    }

    async getHistory(userId: string, limit = 30) {
        const safeUserId = this.normalizeUserId(userId);
        try {
            return await prismaRead.oracleHistory.findMany({
                where: { user_id: safeUserId },
                include: { message: true },
                orderBy: { drawn_at: 'desc' },
                take: limit,
            });
        } catch (error) {
            if (this.isSafeFallbackRuntime() && this.isDbUnavailableError(error)) {
                return [];
            }
            throw error;
        }
    }

    private normalizeUserId(userId?: string) {
        const normalized = String(userId || '').trim();
        if (!this.uuidRegex.test(normalized)) {
            throw new AppError('Unauthorized', 401);
        }
        return normalized;
    }

    private normalizeMood(mood: string): string {
        const mapping: Record<string, string> = {
            'anxious': 'ansioso',
            'sad': 'triste',
            'tired': 'cansado',
            'focused': 'focado',
            'happy': 'feliz',
            'motivated': 'motivado'
        };
        return mapping[mood?.toLowerCase()] || mood?.toLowerCase() || 'neutral';
    }

    private getElementForMood(mood: string): string {
        switch (mood) {
            case 'ansioso': return 'Agua';
            case 'triste': return 'Fogo';
            case 'cansado': return 'Terra';
            case 'focado': return 'Ar';
            default: return 'Ar';
        }
    }

    private async getRandomFallback(): Promise<OracleMessage | null> {
        try {
            const count = await prismaRead.oracleMessage.count();
            if (count === 0) return null;
            const skip = Math.floor(Math.random() * count);
            const [card] = await prismaRead.oracleMessage.findMany({ take: 1, skip });
            return card || null;
        } catch (e) {
            if (this.isSafeFallbackRuntime() && this.isDbUnavailableError(e)) {
                return this.getFallbackByContext('neutral');
            }
            logger.error('oracle.fallback_error', e);
            return null;
        }
    }

    private getFallbackByContext(mood: string): OracleMessage {
        const normalized = this.normalizeMood(mood);
        const candidate = this.fallbackDeck.find((card) => card.moods.includes(normalized));
        return candidate || this.fallbackDeck[0];
    }

    private isSafeFallbackRuntime(): boolean {
        return process.env.NODE_ENV === 'test' || String(process.env.APP_MODE || '').toUpperCase() === 'MOCK';
    }

    private isDbUnavailableError(error: any): boolean {
        const code = String(error?.code || '');
        const message = String(error?.message || '');
        return ['P1000', 'P1001', 'P1002', 'P1017'].includes(code)
            || /authentication failed against database server/i.test(message)
            || /circuit breaker open/i.test(message)
            || /too many authentication errors/i.test(message);
    }
}

export const oracleService = new OracleService();

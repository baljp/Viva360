import prisma, { prismaRead } from '../lib/prisma';
import { OracleMessage } from '@prisma/client';

interface OracleContext {
    mood: string;
    gardenStatus: { health: number; waterNeeded: boolean };
    metamorphosisPhase: string;
}

export class OracleService {
    
    // Core Algorithm: Select the best card based on context
    async drawCard(userId: string, context: OracleContext): Promise<OracleMessage | null> {

        // 1. Fetch Candidate Messages (Filtered by basic rules)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const recentHistory = await prismaRead.oracleHistory.findMany({
            where: {
                user_id: userId,
                drawn_at: { gte: sixtyDaysAgo }
            },
            select: { message_id: true }
        });

        const recentMessageIds = recentHistory.map(h => h.message_id);
        const normalizedMood = this.normalizeMood(context.mood);

        const candidates = await prismaRead.oracleMessage.findMany({
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
        await prisma.oracleHistory.create({
            data: {
                user_id: userId,
                message_id: winner.id,
                context: context as any
            }
        });

        return winner;
    }

    async getToday(userId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const lastDraw = await prismaRead.oracleHistory.findFirst({
            where: {
                user_id: userId,
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
            console.error('Fallback error:', e);
            return null;
        }
    }
}

export const oracleService = new OracleService();

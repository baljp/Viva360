import prisma, { prismaRead } from '../lib/prisma';
import { User } from '@prisma/client'; // Assuming types match or using direct DB types
import { Profile } from '@prisma/client';

interface OracleContext {
    mood: string;
    gardenStatus: { health: number; waterNeeded: boolean };
    metamorphosisPhase: string;
}

export class OracleService {
    
    // Core Algorithm: Select the best card based on context
    async drawCard(userId: string, context: OracleContext) {
        // 1. Fetch Candidate Messages (Filtered by basic rules)
        // - No repeats last 60 days
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

        // Fetch candidates (could benefit from vector search later, but for 3000 items, standard query is fine)
        // We fetch a pool of candidates that MATCH at least one criterion to optimize scoring
        const candidates = await prismaRead.oracleMessage.findMany({
            where: {
                id: { notIn: recentMessageIds },
                // Ideally we filter by at least one matching tag to reduce pool, 
                // but for "serendipity" we might want to score all available or a random subset.
                // For performance, let's fetch those that match mood OR phase OR generic
                 OR: [
                    { moods: { has: context.mood } },
                    { phases: { has: context.metamorphosisPhase } },
                    { category: 'consciencia' }, // Always include general conscious messages
                    { element: this.getElementForMood(context.mood) }
                 ]
            }
        });

        if (candidates.length === 0) {
            // Fallback if user has exhausted all specific content (unlikely)
            return this.getRandomFallback();
        }

        // 2. Score Candidates
        const scoredCandidates = candidates.map(card => {
            let score = 0;
            
            // A. Mood Match (30%)
            if (card.moods.includes(context.mood)) score += 30;
            
            // B. Garden/Element Match (25%)
            // If garden needs water -> Water element
            // If garden is healthy -> Earth/Fire
            const targetElement = context.gardenStatus.waterNeeded ? 'Agua' : 'Terra';
            if (card.element === targetElement) score += 25;

            // C. Metamorphosis Phase (20%)
            if (card.phases.includes(context.metamorphosisPhase)) score += 20;

            // D. Weight/Rarity Adjustment
            // We want slightly higher weight items to appear more often if they match
            score *= Number(card.weight);

            // E. Random noise for variety (Validation against rigid repetition)
            score += Math.random() * 10; 

            return { card, score };
        });

        // 3. Select Winner
        scoredCandidates.sort((a, b) => b.score - a.score);
        const winner = scoredCandidates[0].card;

        // 4. Record History
        // Sync write (fire and forget or await depending on criticality)
        await prisma.oracleHistory.create({
            data: {
                user_id: userId,
                message_id: winner.id,
                context: context as any // JSON
            }
        });

        return winner;
    }

    private getElementForMood(mood: string): string {
        switch (mood) {
            case 'ansioso': return 'Agua'; // Water calms
            case 'triste': return 'Fogo'; // Fire warms/ignites
            case 'cansado': return 'Terra'; // Earth grounds/rests
            case 'focado': return 'Ar'; // Air clarifies
            default: return 'Ar';
        }
    }

    private async getRandomFallback() {
        const count = await prismaRead.oracleMessage.count();
        const skip = Math.floor(Math.random() * count);
        const [card] = await prismaRead.oracleMessage.findMany({ take: 1, skip });
        return card;
    }
}

export const oracleService = new OracleService();

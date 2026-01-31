import { METAMORPHOSIS_PHRASES } from '../src/data/metamorphosisData';

export class PhraseService {
    private usedPhrasesKey = 'viva360.used_phrases';

    private getUsedPhrases(): Record<string, number> {
        const saved = localStorage.getItem(this.usedPhrasesKey);
        return saved ? JSON.parse(saved) : {};
    }

    private saveUsedPhrase(phrase: string) {
        const used = this.getUsedPhrases();
        used[phrase] = Date.now();
        
        // Clean up phrases older than 30 days
        const limit = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const cleaned = Object.fromEntries(
            Object.entries(used).filter(([_, timestamp]) => timestamp > limit)
        );
        
        localStorage.setItem(this.usedPhrasesKey, JSON.stringify(cleaned));
    }

    public getPhrase(mood: string, context: 'JARDIM' | 'CARD'): string {
        const entry = METAMORPHOSIS_PHRASES[mood] || METAMORPHOSIS_PHRASES['Calmo'];
        const list = entry[context];
        const used = this.getUsedPhrases();

        // Sort by frequency/recency (simple version: filter out used)
        const available = list.filter(p => !used[p]);
        
        // If all used, reset or pick oldest? 
        // For simplicity: if all used, clear and pick random
        if (available.length === 0) {
            const picked = list[Math.floor(Math.random() * list.length)];
            this.saveUsedPhrase(picked);
            return picked;
        }

        const picked = available[Math.floor(Math.random() * available.length)];
        this.saveUsedPhrase(picked);
        return picked;
    }

    public getPhrases(mood: string, context: 'JARDIM' | 'CARD'): [string, string] {
        const p1 = this.getPhrase(mood, context);
        const p2 = this.getPhrase(mood, context);
        return [p1, p2];
    }
}

export const phraseService = new PhraseService();

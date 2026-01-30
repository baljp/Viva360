import whispersData from '../data/whispers.json';
import { MoodType } from '../types';

interface GenerateOptions {
    mood: MoodType;
    intention: string;
    gratitude: string;
    timeOfDay?: 'morning' | 'day' | 'night';
}

export class PhraseGenerator {
    private templates: any[];
    private stopwords: Set<string>;

    constructor() {
        this.templates = whispersData.templates;
        this.stopwords = new Set(whispersData.stopwords);
    }

    private extractKeyword(text: string): string {
        if (!text) return "tua essência";
        
        // 1. Tokenize and clean
        const words = text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
            .split(/\s+/);

        // 2. Filter stopwords and short words
        const meaningful = words.filter(w => !this.stopwords.has(w) && w.length > 2);

        // 3. Return the last "meaningful" word (usually the noun/object in PT-BR) 
        // or the whole trimmed text if nothing is left suited.
        // E.g., "Quero paz interior" -> "interior" (might be weak, let's try getting invalid ones out)
        // Better heuristic: "paz interior" -> remove "quero", "ter" -> "paz interior"
        
        // Let's try to reconstruct the core phrase removing stopwords from edges?
        // Fallback: just return the original if short, or the keyword if found.
        
        if (meaningful.length > 0) {
            // Priority: longest word often carries meaning in simple sentences
            return meaningful.reduce((a, b) => a.length > b.length ? a : b);
        }

        return text.trim();
    }

    private getTimeOfDay(): 'morning' | 'day' | 'night' {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'day';
        return 'night';
    }

    public generate(options: GenerateOptions): [string, string] {
        const { mood, intention, gratitude } = options;
        const time = options.timeOfDay || this.getTimeOfDay();

        const coreIntention = this.extractKeyword(intention);
        const coreGratitude = this.extractKeyword(gratitude);

        // Find Candidates
        const candidates = this.templates.filter(t => {
            // Match Mood logic: Exact match OR 'ANY'
            const moodMatch = t.mood === mood || t.mood === 'ANY';
            // Match Time logic: Exact match OR 'any'
            const timeMatch = t.time === time || t.time === 'any';
            return moodMatch && timeMatch;
        });

        // Shuffle
        const shuffled = candidates.sort(() => 0.5 - Math.random());

        // We need 2 distinct phrases if possible
        // One focused on INTENTION, one on GRATITUDE
        let phrase1 = "";
        let phrase2 = "";

        // Try to find an Intention template
        const t1 = shuffled.find(t => t.format.includes("{intention}"));
        if (t1) {
            phrase1 = t1.format.replace("{intention}", coreIntention);
        } else {
            phrase1 = `Que ${coreIntention} ilumine seu caminho.`; // Fallback
        }

        // Try to find a Gratitude template (different from t1)
        const t2 = shuffled.find(t => t.format.includes("{gratitude}") && t.id !== t1?.id);
        if (t2) {
            phrase2 = t2.format.replace("{gratitude}", coreGratitude);
        } else {
             phrase2 = `A gratidão por ${coreGratitude} te fortalece.`; // Fallback
        }

        return [phrase1, phrase2];
    }
}

export const phraseGenerator = new PhraseGenerator();

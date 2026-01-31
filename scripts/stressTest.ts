import { SoulCardEngine } from '../src/engines/SoulCardEngine';
import { MOCK_SOUL_CARDS } from '../src/data/mockSoulCards';

const auditOracle = (iterations: number = 1000) => {
    console.log(`\n🧠 AUDITING ORACLE: ${iterations} DRAWS...`);
    const stats: Record<string, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
    };
    const cardHits: Record<string, number> = {};
    
    const startTime = Date.now();
    for(let i = 0; i < iterations; i++) {
        const card = SoulCardEngine.drawCard(1, 'Calmo');
        stats[card.rarity]++;
        cardHits[card.id] = (cardHits[card.id] || 0) + 1;
    }
    const endTime = Date.now();

    console.table(stats);
    console.log(`⏱ Average Latency: ${(endTime - startTime) / iterations}ms`);
    
    // Check for collisions/repetition
    const repeatRate = Object.values(cardHits).filter(v => v > 1).length / MOCK_SOUL_CARDS.length;
    console.log(`🔄 Unique Card Coverage: ${((Object.keys(cardHits).length / MOCK_SOUL_CARDS.length) * 100).toFixed(1)}%`);
};

const auditMetamorphosis = (entries: number = 100) => {
    console.log(`\n🌿 AUDITING METAMORPHOSIS: ${entries} ENTRIES...`);
    
    const startTime = Date.now();
    const mockEntries = Array.from({ length: entries }, (_, i) => ({
        id: i,
        mood: 'VIBRANTE',
        photoThumb: 'mock_url',
        quote: 'Life is a journey.',
        timestamp: new Date(Date.now() - i * 86400000).toISOString()
    }));
    const endTime = Date.now();

    console.log(`✅ Generated ${entries} entries in ${endTime - startTime}ms`);
    console.log(`📊 Estimated History Payload: ${(JSON.stringify(mockEntries).length / 1024).toFixed(2)} KB`);
};

// Run
auditOracle(1000);
auditMetamorphosis(100);

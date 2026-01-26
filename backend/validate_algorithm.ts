import { DeterministicEngine, Mood } from './src/lib/determinism';

const MOODS: Mood[] = ['Feliz', 'Calmo', 'Grato', 'Motivado', 'Cansado', 'Ansioso', 'Triste', 'Sobrecarregado'];

async function validate() {
    console.log('🧠 STARTING ALGORTIHM VALIDATION (1,000,000 SIMULATIONS)...');
    
    const TOTAL_RUNS = 1000000;
    const start = process.hrtime();
    
    const quoteCounts: Record<string, number> = {};
    const ritualCounts: Record<string, number> = {};
    let lastQuote = '';
    let repetitionCount = 0;

    for (let i = 0; i < TOTAL_RUNS; i++) {
        const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
        // Mock history
        const history: Mood[] = [
            MOODS[Math.floor(Math.random() * MOODS.length)],
            MOODS[Math.floor(Math.random() * MOODS.length)],
            MOODS[Math.floor(Math.random() * MOODS.length)]
        ];

        const result = DeterministicEngine.process(mood, history);

        // Track stats
        if (!quoteCounts[result.quote]) quoteCounts[result.quote] = 0;
        quoteCounts[result.quote]++;

        if (result.quote === lastQuote) repetitionCount++;
        lastQuote = result.quote;
    }

    const end = process.hrtime(start);
    const durationMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTimePerRun = durationMs / TOTAL_RUNS;

    console.log('\n📊 DETERMINISTIC ENGINE METRICS');
    console.log('================================');
    console.log(`Runs: ${TOTAL_RUNS}`);
    console.log(`Total Time: ${durationMs.toFixed(2)}ms`);
    console.log(`Avg Latency: ${avgTimePerRun.toFixed(6)}ms (Target: < 120ms)`);
    
    const repetitionRate = (repetitionCount / TOTAL_RUNS) * 100;
    console.log(`Immediate Repetition Rate: ${repetitionRate.toFixed(4)}% (Target: < 2%)`);

    const uniqueQuotes = Object.keys(quoteCounts).length;
    console.log(`Unique Quotes Triggered: ${uniqueQuotes}`);

    if (repetitionRate < 2 && avgTimePerRun < 5) {
        console.log('\n✅ ALGORITHM STATUS: PASSED (Golden Standard)');
    } else {
        console.log('\n❌ ALGORITHM STATUS: FAILED');
        process.exit(1);
    }
}

validate();

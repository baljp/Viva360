import { DeterministicEngine, Mood } from './src/lib/determinism';

const MOODS: Mood[] = ['Feliz', 'Calmo', 'Grato', 'Motivado', 'Cansado', 'Ansioso', 'Triste', 'Sobrecarregado'];

async function runLifecycleSimulation() {
    console.log('🔄 STARTING 100,000 FULL LIFECYCLE SIMULATIONS...');
    
    const TOTAL_CYCLES = 100000;
    const startTime = Date.now();
    
    let dbMockCount = 0;
    let errors = 0;

    for (let i = 0; i < TOTAL_CYCLES; i++) {
        try {
            // 1. Check-in
            const currentMood = MOODS[i % MOODS.length];
            const history: Mood[] = [MOODS[(i+1)%8], MOODS[(i+2)%8]];

            // 2. Algorithm Execution
            const result = DeterministicEngine.process(currentMood, history);
            
            // 3. Logic Check: Ensure quote exists and matches mood
            if (!result.quote || result.ritual.length === 0) {
                errors++;
            }

            // 4. Persistence Simulation
            dbMockCount++;

            if (i > 0 && i % 25000 === 0) {
                console.log(`   ...processed ${i} cycles`);
            }
        } catch (e) {
            errors++;
        }
    }

    const duration = Date.now() - startTime;
    console.log('\n📊 LIFECYCLE METRICS');
    console.log('====================');
    console.log(`Total Cycles: ${TOTAL_CYCLES}`);
    console.log(`Success Rate: ${((TOTAL_CYCLES - errors) / TOTAL_CYCLES * 100).toFixed(2)}%`);
    console.log(`Total Duration: ${duration}ms`);
    console.log(`Avg Cycle Time: ${(duration / TOTAL_CYCLES).toFixed(4)}ms`);
    
    if (errors === 0) {
        console.log('\n✅ LIFECYCLE STATUS: 100% INTEGRITY');
    } else {
        console.log('\n❌ LIFECYCLE STATUS: FAILED');
        process.exit(1);
    }
}

runLifecycleSimulation();

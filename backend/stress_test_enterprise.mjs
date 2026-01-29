
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
// Node 18+ has native fetch, but type checking might need node-fetch in TS. In JS, global fetch is available (Node 21+).
// If older node, might need node-fetch. But user has Node 23.
// Wait, `import` syntax requires "type": "module" in package.json or .mjs extension.
// I will use .mjs extension to be safe.

const TOTAL_USERS = 5000;
const DURATION_SECONDS = 120; // 2 minutes sustained
const RAMP_UP_SECONDS = 60;
const API_URL = 'http://localhost:3000/api';

// --- MAIN THREAD COORDINATOR ---
if (isMainThread) {
    console.log(`🚀 STARTING ENTERPRISE STRESS TEST (${TOTAL_USERS} Users)`);
    console.log(`⏱️  Ramp-up: ${RAMP_UP_SECONDS}s | Sustained: ${DURATION_SECONDS}s`);

    let activeUsers = 0;
    const workers = [];
    const stats = { requests: 0, errors: 0, latencySum: 0 };
    
    // Spawn Workers in batches to simulate Ramp-up
    const userBatchSize = 100;
    const interval = (RAMP_UP_SECONDS * 1000) / (TOTAL_USERS / userBatchSize);
    
    let spawned = 0;
    const spawnInterval = setInterval(() => {
        if (spawned >= TOTAL_USERS) {
            clearInterval(spawnInterval);
            console.log(`✅ All ${TOTAL_USERS} users spawned. entering SUSTAINED phase.`);
            return;
        }

        const batch = Math.min(userBatchSize, TOTAL_USERS - spawned);
        for (let i = 0; i < batch; i++) {
            // Using __filename equivalent in ESM
            const worker = new Worker(new URL(import.meta.url), {
                workerData: { id: spawned + i, type: (spawned + i) < 4000 ? 'SEEKER' : ((spawned + i) < 4900 ? 'GUARDIAN' : 'SANCTUARY') }
            });
            
            worker.on('message', (msg) => {
                if (msg.type === 'metric') {
                    stats.requests++;
                    stats.latencySum += msg.latency;
                    if (!msg.success) stats.errors++;
                }
            });
            
            workers.push(worker);
        }
        spawned += batch;
        activeUsers = spawned;
        process.stdout.write(`\r📈 Active Users: ${activeUsers}/${TOTAL_USERS}`);
    }, interval);

    // Monitoring Stats Loop
    setInterval(() => {
        const avgLat = stats.requests > 0 ? (stats.latencySum / stats.requests).toFixed(2) : 0;
        const errRate = stats.requests > 0 ? ((stats.errors / stats.requests) * 100).toFixed(2) : 0;
        const rps = (stats.requests / 5).toFixed(0); // Appox RPS (5s window) - simplified
        console.log(`\n📊 [STATS] RPS: ~${rps} | Latency: ${avgLat}ms | Errors: ${errRate}%`);
        stats.requests = 0; stats.latencySum = 0; stats.errors = 0; // Reset window
    }, 5000);

    // End Test
    setTimeout(() => {
        console.log('\n🛑 STOPPING TEST...');
        workers.forEach(w => w.terminate());
        process.exit(0);
    }, (RAMP_UP_SECONDS + DURATION_SECONDS) * 1000);

} else {
    // --- WORKER THREAD (User Simulator) ---
    const { id, type } = workerData;
    
    // Lifecycle Loop
    const runUser = async () => {
        // Node 23 has global fetch
        while (true) {
            const start = Date.now();
            let success = true;
            try {
                // Simulate action based on profile
                if (type === 'SEEKER') {
                    await fetch(`${API_URL}/ping`); 
                } else if (type === 'GUARDIAN') {
                    await fetch(`${API_URL}/ping`); 
                } else {
                    await fetch(`${API_URL}/ping`); 
                }
                // Random failure simulation? No, server does that.
            } catch (e) {
                // console.error(e);
                success = false;
            }
            const latency = Date.now() - start;
            
            parentPort?.postMessage({ type: 'metric', latency, success });
            
            // Think time (random 500ms - 2000ms)
            await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
        }
    };
    
    runUser();
}

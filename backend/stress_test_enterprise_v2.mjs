import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

const TOTAL_USERS = 5000;
const DURATION_SECONDS = 300; // 5 minutes sustained
const RAMP_UP_SECONDS = 120; // 2 minutes ramp-up
const API_URL = 'http://localhost:3000/api';

if (isMainThread) {
    console.log(`🚀 STARTING ENTERPRISE V2 STRESS TEST (${TOTAL_USERS} Users)`);
    console.log(`⏱️  Ramp-up: ${RAMP_UP_SECONDS}s | Sustained: ${DURATION_SECONDS}s`);

    let activeUsers = 0;
    const workers = [];
    const stats = { requests: 0, errors: 0, latencySum: 0, actions: {} };
    
    // Spawn Workers in batches
    const userBatchSize = 100;
    const interval = (RAMP_UP_SECONDS * 1000) / (TOTAL_USERS / userBatchSize);
    
    let spawned = 0;
    const spawnInterval = setInterval(() => {
        if (spawned >= TOTAL_USERS) {
            clearInterval(spawnInterval);
            console.log(`\n✅ All ${TOTAL_USERS} users spawned. Entering SUSTAINED phase.`);
            return;
        }

        const batch = Math.min(userBatchSize, TOTAL_USERS - spawned);
        for (let i = 0; i < batch; i++) {
            const worker = new Worker(new URL(import.meta.url), {
                workerData: { id: spawned + i }
            });
            
            worker.on('message', (msg) => {
                if (msg.type === 'metric') {
                    stats.requests++;
                    stats.latencySum += msg.latency;
                    if (!msg.success) stats.errors++;
                    
                    const actionKey = msg.action || 'unknown';
                    stats.actions[actionKey] = (stats.actions[actionKey] || 0) + 1;
                }
            });
            
            workers.push(worker);
        }
        spawned += batch;
        process.stdout.write(`\r📈 Progress: ${spawned}/${TOTAL_USERS} users active...`);
    }, interval);

    // Monitoring Stats Loop
    setInterval(() => {
        const avgLat = stats.requests > 0 ? (stats.latencySum / stats.requests).toFixed(2) : 0;
        const errRate = stats.requests > 0 ? ((stats.errors / stats.requests) * 100).toFixed(2) : 0;
        console.log(`\n📊 [METRICS] Req/s: ~${(stats.requests / 5).toFixed(0)} | Latency: ${avgLat}ms | Errors: ${errRate}%`);
        // console.log('Actions Grouped:', stats.actions);
        stats.requests = 0; stats.latencySum = 0; stats.errors = 0; stats.actions = {}; // Reset window
    }, 5000);

    // Safety Timeout
    setTimeout(() => {
        console.log('\n🛑 STOPPING TEST...');
        workers.forEach(w => w.terminate());
        process.exit(0);
    }, (RAMP_UP_SECONDS + DURATION_SECONDS + 10) * 1000);

} else {
    // --- WORKER THREAD (Persona Simulator) ---
    const { id } = workerData;
    const email = `stress_user_${id}@viva360.test`;
    const password = 'Password123!';
    let token = '';

    const actions = [
        { name: 'GET_HEALTH', path: '/health', method: 'GET' },
        { name: 'ORACLE_DRAW', path: '/oracle/draw', method: 'POST', body: { mood: 'curioso' } },
        { name: 'ORACLE_TODAY', path: '/oracle/today', method: 'GET' },
        { name: 'GET_RITUALS', path: '/rituals?period=morning', method: 'GET' },
        { name: 'SAVE_RITUAL', path: '/rituals/save', method: 'POST', body: { period: 'morning', data: { meditation: true } } },
        { name: 'GET_MARKETPLACE', path: '/marketplace/products', method: 'GET' },
        { name: 'GET_FINANCE', path: '/finance/summary', method: 'GET' },
        { name: 'GET_PROFILES', path: '/profiles?role=PROFESSIONAL', method: 'GET' },
        { name: 'GET_TRIBE', path: '/tribe', method: 'GET' },
        { name: 'POST_TRIBE', path: '/tribe/post', method: 'POST', body: { content: 'Stress test insight ' + id, type: 'insight' } },
        { name: 'CHECKIN', path: '/metamorphosis/checkin', method: 'POST', body: { mood: 'vibrante', thumb: 'data:image/png;base64,mock' } },
        { name: 'GET_NOTIFICATIONS', path: '/notifications', method: 'GET' }
    ];

    const runAction = async () => {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const start = Date.now();
        let success = true;

        try {
            const res = await fetch(`${API_URL}${action.path}`, {
                method: action.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: action.method === 'POST' ? JSON.stringify(action.body) : undefined,
                // Add a reasonable timeout for stress test
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) success = false;
        } catch (e) {
            success = false;
        }

        const latency = Date.now() - start;
        parentPort?.postMessage({ type: 'metric', latency, success, action: action.name });
    };

    const runUser = async () => {
        try {
            // 1. Register or Login
            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                signal: AbortSignal.timeout(10000)
            });

            if (loginRes.ok) {
                const data = await loginRes.json();
                token = data.session?.access_token || data.token;
            } else {
                // Try register if login fails (first-timer)
                await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name: `User ${id}`, role: 'CLIENT' }),
                    signal: AbortSignal.timeout(10000)
                });
                
                // Retry login
                const loginRes2 = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    signal: AbortSignal.timeout(10000)
                });
                if (loginRes2.ok) {
                    const data2 = await loginRes2.json();
                    token = data2.session?.access_token || data2.token;
                }
            }

            // 2. Continuous Loop
            while (true) {
                await runAction();
                // Think time: realistic behavior (3s - 10s)
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 7000));
            }
        } catch (e) {
            // Silent drop out if auth fails criticaly
        }
    };

    runUser();
}

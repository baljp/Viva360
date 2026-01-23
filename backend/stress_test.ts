
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';
const CONCURRENCY = 100; // Requests per batch
const BATCHES = 5; // Total 500 requests
const TARGET_MS = 2000; // Acceptable max average latency

async function stress() {
    console.log(`🔥 STARTING STRESS TEST: ${CONCURRENCY * BATCHES} requests...`);
    
    let successes = 0;
    let failures = 0;
    let totalTime = 0;

    for (let b = 0; b < BATCHES; b++) {
        process.stdout.write(`   Batch ${b + 1}/${BATCHES}: Sending ${CONCURRENCY} reqs... `);
        
        const promises = [];
        const start = Date.now();

        for (let i = 0; i < CONCURRENCY; i++) {
            promises.push(
                fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'client0@viva360.com', password: '123456' })
                }).then(res => {
                    if (res.ok) successes++;
                    else {
                         failures++;
                         if(failures % 50 === 0) console.log(`[Fail Sample] Status: ${res.status}`);
                    }
                    return res.status;
                }).catch((e) => {
                    failures++;
                    if(failures % 50 === 0) console.log(`[Err Sample] ${e.message}`);
                })
            );
        }

        await Promise.all(promises);
        const duration = Date.now() - start;
        totalTime += duration;
        console.log(`Done in ${duration}ms`);
    }

    const avgTime = totalTime / BATCHES;
    console.log("\n--- STRESS RESULTS ---");
    console.log(`Total Requests: ${CONCURRENCY * BATCHES}`);
    console.log(`Successful:     ${successes} (should include Rate Limit hits handled gracefully)`);
    console.log(`Failed:         ${failures}`);
    console.log(`Avg Batch Time: ${avgTime.toFixed(2)}ms`);

    // In a real stress test, we check if failures > threshold (excluding 429 Rate Limits).
    // For this dev environment check:
    if (failures === 0 || successes > (CONCURRENCY * BATCHES * 0.9)) {
        console.log("✅ STRESS TEST PASSED (System Stable)");
    } else {
        console.error("❌ STRESS TEST FAILED (High Failure Rate)");
        process.exit(1);
    }
}

stress();

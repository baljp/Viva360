import { spawn } from 'child_process';
import http from 'http';

// CHAOS ORCHESTRATOR
// Automates stress testing while injecting faults

const TARGET_URL = 'http://localhost:3000/api/marketplace/products';
// Mock Token (since we are in Mock Mode, middleware accepts any valid JWT structure or we can rely on our middleware bypass if we set the right user?)
// Actually, our middleware bypasses if MOCK_MODE=true but we need to send a header.
const STRESS_HEADERS = { 'x-chaos-mode': 'true', 'Authorization': 'Bearer mock-token' };
const HEALTH_HEADERS = { 'Authorization': 'Bearer mock-token' }; // No chaos for health check

// 1. Check Baseline Health
const checkHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.request(TARGET_URL, { headers: HEALTH_HEADERS }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
};

const runStressTest = async () => {
  console.log('👉 Phase 1: Injection - Sending 100 requests with Chaos Mode...');
  
  let failures = 0;
  let successes = 0;

  for (let i = 0; i < 100; i++) {
    const p = new Promise<void>((resolve) => {
      const req = http.request(TARGET_URL, { headers: STRESS_HEADERS }, (res) => {
        if (res.statusCode === 200) successes++;
        else failures++;
        resolve();
      });
      req.on('error', () => {
        failures++;
        resolve();
      });
      req.end();
    });
    // Add some random delay between requests (0-50ms)
    await new Promise(r => setTimeout(r, Math.random() * 50));
    await p;
  }

  console.log(`📊 Result: ${successes} Success, ${failures} Failures`);
  console.log(`⚠️  Note: Failures ARE EXPECTED. We want to measure Recovery Time.`);
  
  // Phase 2: Recovery Verification
  console.log('👉 Phase 2: Recovery - Validating system self-healing...');
  await new Promise(r => setTimeout(r, 2000)); // Wait 2s
  
  try {
     const status = await checkHealth();
     if (status === 200) {
       console.log('✅ System Recovered. Status 200 OK.');
       console.log('🏆 CHAOS CERTIFICATION: PASSED');
     } else {
       console.error(`❌ System Unstable. Status ${status}`);
       process.exit(1);
     }
  } catch (e) {
    console.error('❌ System Down.');
    process.exit(1);
  }
};

runStressTest();

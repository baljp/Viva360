import { test, expect } from '@playwright/test';

// Concurrency check on lightweight public endpoints
const CONCURRENT_USERS = 50; // High throughput check

test.describe('Stress / Concurrency @stress', () => {

  test(`Simulate ${CONCURRENT_USERS} concurrent API pings`, async ({ request }) => {

    // Create an array of promises
    const startTime = Date.now();
    const actions = Array.from({ length: CONCURRENT_USERS }).map(async (_, i) => {
      try {
        const res = await request.get('/api/ping'); // Health check ping
        expect(res.status()).toBe(200);
        return Date.now() - startTime;
      } catch (e) {
        console.error(`Request ${i} failed:`, e);
        throw e;
      }
    });

    const durations = await Promise.all(actions);
    const maxDuration = Math.max(...durations);
    console.log(`Todos os ${CONCURRENT_USERS} pings na API completados com duração máxima atingida de: ${maxDuration}ms`);

    // Performance SLA 
    expect(maxDuration).toBeLessThan(15000);
  });
});

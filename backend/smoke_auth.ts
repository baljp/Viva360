/**
 * Smoke test for Viva360 auth flows (email/password + profile gate).
 *
 * Usage:
 *   API_URL=http://localhost:3001/api npx tsx backend/smoke_auth.ts
 *   API_URL=https://viva360.vercel.app/api npx tsx backend/smoke_auth.ts
 */

const API_URL = (process.env.API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const TIMEOUT_MS = 15_000;

type HttpMethod = 'GET' | 'POST';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(
  label: string,
  method: HttpMethod,
  path: string,
  opts?: { body?: any; token?: string; expectedStatus?: number },
): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    const elapsedMs = Date.now() - startedAt;
    const expected = typeof opts?.expectedStatus === 'number' ? opts.expectedStatus : undefined;
    const ok = expected ? res.status === expected : res.ok;

    const text = await res.text();
    const parsed = text ? (JSON.parse(text) as T) : ({} as T);

    if (!ok) {
      throw new Error(`${label} failed (${res.status}) in ${elapsedMs}ms: ${text.slice(0, 200)}`);
    }

    // Minimal progress output
    console.log(`[OK] ${label} (${res.status}) ${elapsedMs}ms`);
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

function uniqueEmail() {
  const ts = Date.now();
  return `smoke.${ts}@example.com`;
}

async function main() {
  console.log(`🔎 Smoke auth test: ${API_URL}`);

  await request('Ping', 'GET', '/ping');

  const email = uniqueEmail();
  const password = 'Password123!';
  const name = 'Smoke Test';

  const pre1 = await request<{ allowed: boolean; role: string | null }>(
    'Precheck (unknown)',
    'POST',
    '/auth/precheck-login',
    { body: { email } },
  );
  if (pre1.allowed) throw new Error('Expected precheck to be false for unknown email');

  const reg = await request<any>('Register', 'POST', '/auth/register', {
    body: { email, password, name, role: 'CLIENT' },
  });
  const regToken = reg?.session?.access_token;
  if (!regToken) throw new Error('Register did not return access_token');
  if (String(reg?.user?.role || '').toUpperCase() !== 'CLIENT') throw new Error('Register returned wrong role');

  const pre2 = await request<{ allowed: boolean; role: string | null }>(
    'Precheck (after register)',
    'POST',
    '/auth/precheck-login',
    { body: { email } },
  );
  if (!pre2.allowed) throw new Error('Expected precheck to be true after register');

  await request('Login (wrong password)', 'POST', '/auth/login', {
    body: { email, password: 'WrongPassword123!' },
    expectedStatus: 401,
  });

  const login = await request<any>('Login', 'POST', '/auth/login', { body: { email, password } });
  const token = login?.session?.access_token;
  if (!token) throw new Error('Login did not return access_token');
  if (String(login?.user?.role || '').toUpperCase() !== 'CLIENT') throw new Error('Login returned wrong role');

  await request('Profiles/me', 'GET', '/profiles/me', { token });

  // Works with internal JWT too; for OAuth it will be a Supabase token.
  await request('OAuth ensure-profile', 'POST', '/auth/oauth/ensure-profile', {
    token,
    body: { role: 'CLIENT' },
  });

  // Small delay to reduce flakiness on eventual consistency.
  await sleep(250);

  console.log('✅ Smoke auth test completed');
}

main().catch((err) => {
  console.error('❌ Smoke auth test failed:', err?.message || err);
  process.exit(1);
});


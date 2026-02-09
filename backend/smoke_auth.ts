/**
 * Smoke test for Viva360 auth flows (invite/allowlist policy).
 *
 * Usage:
 *   API_URL=http://localhost:3001/api npx tsx backend/smoke_auth.ts
 *   API_URL=https://viva360.vercel.app/api npx tsx backend/smoke_auth.ts
 *
 * Optional happy-path (authorized invite):
 *   SMOKE_ALLOWLIST_EMAIL=allowed@example.com \
 *   SMOKE_ALLOWLIST_PASSWORD=Password123! \
 *   SMOKE_ALLOWLIST_NAME="Smoke Allowlisted" \
 *   npx tsx backend/smoke_auth.ts
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

  const unauthorizedEmail = uniqueEmail();

  const pre1 = await request<{ allowed: boolean; role: string | null }>(
    'Precheck (unknown)',
    'POST',
    '/auth/precheck-login',
    { body: { email: unauthorizedEmail } },
  );
  if (pre1.allowed) throw new Error('Expected precheck to be false for unknown email');

  await request('Register blocked (unknown email)', 'POST', '/auth/register', {
    body: { email: unauthorizedEmail, password: 'Password123!', name: 'Unauthorized', role: 'CLIENT' },
    expectedStatus: 403,
  });

  await request('Login (wrong password)', 'POST', '/auth/login', {
    body: { email: unauthorizedEmail, password: 'WrongPassword123!' },
    expectedStatus: 401,
  });

  const allowlistedEmail = String(process.env.SMOKE_ALLOWLIST_EMAIL || '').trim().toLowerCase();
  const allowlistedPassword = String(process.env.SMOKE_ALLOWLIST_PASSWORD || '').trim();
  const allowlistedName = String(process.env.SMOKE_ALLOWLIST_NAME || 'Smoke Allowlisted').trim();
  if (allowlistedEmail && allowlistedPassword) {
    const preAllowed = await request<{ allowed: boolean; role: string | null; canRegister?: boolean }>(
      'Precheck (allowlisted)',
      'POST',
      '/auth/precheck-login',
      { body: { email: allowlistedEmail } },
    );

    if (!preAllowed.allowed && !preAllowed.canRegister) {
      throw new Error('Allowlisted email is neither login-enabled nor register-enabled.');
    }

    if (preAllowed.canRegister) {
      await request<any>('Register (allowlisted)', 'POST', '/auth/register', {
        body: { email: allowlistedEmail, password: allowlistedPassword, name: allowlistedName, role: 'CLIENT' },
      });
      await sleep(250);
    }

    const login = await request<any>('Login (allowlisted)', 'POST', '/auth/login', {
      body: { email: allowlistedEmail, password: allowlistedPassword },
    });
    const token = login?.session?.access_token;
    if (!token) throw new Error('Login did not return access_token for allowlisted account');
    await request('Profiles/me (allowlisted)', 'GET', '/profiles/me', { token });
  } else {
    console.log('ℹ️ Skipping allowlisted happy path (set SMOKE_ALLOWLIST_EMAIL + SMOKE_ALLOWLIST_PASSWORD).');
  }

  console.log('✅ Smoke auth test completed');
}

main().catch((err) => {
  console.error('❌ Smoke auth test failed:', err?.message || err);
  process.exit(1);
});

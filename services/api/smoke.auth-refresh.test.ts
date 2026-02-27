// ─── smoke.auth-refresh.test.ts ──────────────────────────────────────────────
//
// Smoke E2E: "401 → refresh → request repete → não desloga"
//
// Verifica o contrato completo do silent refresh no requestClient:
//
//   1. Request normal recebe 401
//   2. acquireToken() dispara onUnauthorized (refresh de token)
//   3. O mesmo request é repetido com o token novo no header
//   4. 200 é retornado ao caller — sem disparar 'viva360:session-expired'
//   5. VARIANTE: N requests simultâneos com 401 disparam apenas 1 refresh
//
// ─────────────────────────────────────────────────────────────────────────────

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestClient } from './requestClient';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const json200 = (body: unknown = { ok: true }) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const json401 = () =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

/** Collects dispatched CustomEvent types on the window stub */
const makeWindowStub = () => {
  const events: string[] = [];
  const stub = { dispatchEvent: (e: Event) => { events.push((e as CustomEvent).type); } };
  vi.stubGlobal('window', stub);
  return events;
};

/** Creates a client wired to a controllable refresh fn and a token store */
const makeClient = (opts: {
  refreshToken?: string | null;
  getToken?: () => string;
} = {}) => {
  let storedToken = 'initial-token';

  const onUnauthorized = vi.fn().mockImplementation(async () => {
    const newToken = opts.refreshToken ?? 'refreshed-token';
    if (newToken !== null) storedToken = newToken;
    return newToken;
  });

  const client = createRequestClient({
    apiUrl: 'http://api',
    getHeaders: () => ({ Authorization: `Bearer ${storedToken}` }),
    retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
    isLikelyNetworkError: () => false,
    captureError: vi.fn(),
    onUnauthorized,
  });

  return { client, onUnauthorized, getStoredToken: () => storedToken };
};

// ─────────────────────────────────────────────────────────────────────────────

describe('smoke: 401 → refresh → request repete → não desloga', () => {
  beforeEach(() => { vi.useRealTimers(); });
  afterEach(() => { vi.restoreAllMocks(); });

  // ── Cenário 1: fluxo básico ───────────────────────────────────────────────

  it('401 → refresh → retry bem-sucedido retorna payload ao caller', async () => {
    const sessionEvents = makeWindowStub();

    // Servidor: primeira chamada devolve 401; segunda (pós-refresh) devolve 200
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json401())
      .mockResolvedValueOnce(json200({ user: 'Jane' }));
    vi.stubGlobal('fetch', fetchMock);

    const { client, onUnauthorized } = makeClient();
    const result = await client('/me', { retries: 0 });

    // ── Assertivas de contrato ──────────────────────────────────────────────
    expect(result).toEqual({ user: 'Jane' });

    // refresh foi chamado exatamente 1 vez
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    // fetch foi chamado 2 vezes: original + retry pós-refresh
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // segunda chamada usa o token novo
    const secondCallHeaders = fetchMock.mock.calls[1][1]?.headers as Record<string, string>;
    expect(secondCallHeaders['Authorization']).toBe('Bearer refreshed-token');

    // MAIS IMPORTANTE: sem logout disparado
    expect(sessionEvents).not.toContain('viva360:session-expired');
  });

  // ── Cenário 2: refresh falha → logout DEVE disparar ───────────────────────

  it('401 → refresh falha → dispara viva360:session-expired e lança SESSION_EXPIRED', async () => {
    const sessionEvents = makeWindowStub();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json401()));
    const { client } = makeClient({ refreshToken: null }); // refresh retorna null

    await expect(client('/secret', { retries: 0 })).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
      status: 401,
    });

    // evento de logout DEVE ter sido disparado
    expect(sessionEvents).toContain('viva360:session-expired');
  });

  // ── Cenário 3: sem onUnauthorized → 401 chega direto ao caller ───────────

  it('sem onUnauthorized configurado: 401 falha imediatamente sem tentar refresh', async () => {
    const sessionEvents = makeWindowStub();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json401()));

    const client = createRequestClient({
      apiUrl: 'http://api',
      getHeaders: () => ({}),
      retryableStatusCodes: new Set([]),
      isLikelyNetworkError: () => false,
      captureError: vi.fn(),
      // onUnauthorized ausente
    });

    // Com skipAuthRefresh o cliente não tenta refresh e lança o erro
    await expect(client('/x', { retries: 0, skipAuthRefresh: true })).rejects.toBeTruthy();

    // sem logout — o caller decide o que fazer
    expect(sessionEvents).not.toContain('viva360:session-expired');
  });

  // ── Cenário 4: N requests simultâneos com 401 → apenas 1 refresh ─────────

  it('N requests simultâneos com 401 disparam apenas UM refresh (lock de concorrência)', async () => {
    vi.useRealTimers();

    let fetchCallN = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      fetchCallN++;
      // Primeiras 3 chamadas são os 401 iniciais; as seguintes retornam 200
      return fetchCallN <= 3 ? json401() : json200({ n: fetchCallN });
    }));

    // Refresh lento: 20 ms de latência (garante que os 3 requests vejam o mesmo refreshPromise)
    let refreshCount = 0;
    const onUnauthorized = vi.fn().mockImplementation(async () => {
      refreshCount++;
      await new Promise((r) => setTimeout(r, 20));
      return 'shared-new-token';
    });

    const { client } = makeClient();
    // Substitui o onUnauthorized para contar calls
    const clientWithSpy = createRequestClient({
      apiUrl: 'http://api',
      getHeaders: () => ({ Authorization: 'Bearer tok' }),
      retryableStatusCodes: new Set([]),
      isLikelyNetworkError: () => false,
      captureError: vi.fn(),
      onUnauthorized,
    });

    const [a, b, c] = await Promise.all([
      clientWithSpy('/r1', { retries: 0 }),
      clientWithSpy('/r2', { retries: 0 }),
      clientWithSpy('/r3', { retries: 0 }),
    ]);

    // GARANTIA PRINCIPAL: apenas 1 refresh disparado para N requests
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    // Todos receberam resposta válida (não deslogaram)
    expect(a).toMatchObject({ n: expect.any(Number) });
    expect(b).toMatchObject({ n: expect.any(Number) });
    expect(c).toMatchObject({ n: expect.any(Number) });
  });

  // ── Cenário 5: 401 pós-refresh → SESSION_EXPIRED uma única vez ───────────

  it('401 após refresh bem-sucedido → SESSION_EXPIRED sem loop (1 dispatch)', async () => {
    const sessionEvents = makeWindowStub();

    // Servidor SEMPRE retorna 401 (token inválido mesmo após refresh)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json401()));

    const { client } = makeClient({ refreshToken: 'ok-but-server-still-rejects' });

    await expect(client('/vault', { retries: 0 })).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });

    // evento disparado exatamente 1 vez — sem loop ou duplicação
    const expiredEvents = sessionEvents.filter((e) => e === 'viva360:session-expired');
    expect(expiredEvents).toHaveLength(1);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestClient, type RequestClientDeps } from './requestClient';

// ─── Factories ────────────────────────────────────────────────────────────────

const ok200 = (body: unknown = { ok: true }) =>
  new Response(JSON.stringify(body), { status: 200 });

const err = (status: number, body: unknown = { error: 'fail' }) =>
  new Response(JSON.stringify(body), { status });

const makeAbortError = () =>
  Object.assign(new Error('aborted'), { name: 'AbortError' });

/** Fetch que nunca resolve — usado para testar abort/timeout */
const hangingFetch = vi.fn((_url: string, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    if (signal?.aborted) { reject(makeAbortError()); return; }
    signal?.addEventListener('abort', () => reject(makeAbortError()), { once: true });
  }),
);

interface ClientOpts {
  onUnauthorized?: RequestClientDeps['onUnauthorized'];
  captureError?: RequestClientDeps['captureError'];
}

const createClient = ({ onUnauthorized, captureError = vi.fn() }: ClientOpts = {}) =>
  createRequestClient({
    apiUrl: 'http://api',
    getHeaders: () => ({ Authorization: 'Bearer tok' }),
    retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
    isLikelyNetworkError: (m) => String(m || '').toLowerCase().includes('network'),
    captureError,
    onUnauthorized,
  });

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('requestClient — comportamentos básicos', () => {

  it('retorna payload em request bem-sucedida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok200({ user: 'João' })));
    const req = createClient();
    const result = await req('/me', { retries: 0 });
    expect(result).toEqual({ user: 'João' });
  });

  it('faz retry exponencial em 503 e retorna no segundo attempt', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(err(503))
      .mockResolvedValueOnce(ok200());
    vi.stubGlobal('fetch', fetchMock);

    const req = createClient();
    const p   = req('/data', { retries: 1, retryDelayMs: 100 });

    // Avança o timer do primeiro backoff (2^0 * 100 = 100 ms)
    await vi.advanceTimersByTimeAsync(100);
    const result = await p;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it('lança após esgotar todos os retries', async () => {
    vi.useRealTimers(); // wait() usa setTimeout real
    const capture = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(err(503)));

    const req = createClient({ captureError: capture });
    await expect(
      req('/broken', { retries: 2, retryDelayMs: 1 })
    ).rejects.toMatchObject({ status: 503 });

    expect(capture).toHaveBeenCalledTimes(1);
  });

  it('aborta por timeout e chama captureError', async () => {
    vi.stubGlobal('fetch', hangingFetch);
    const capture = vi.fn();
    const req = createClient({ captureError: capture });

    const p = req('/slow', { retries: 0, timeoutMs: 100 });
    await vi.advanceTimersByTimeAsync(100);

    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it('respeita abort externo e chama captureError', async () => {
    vi.stubGlobal('fetch', hangingFetch);
    const capture = vi.fn();
    const req     = createClient({ captureError: capture });
    const aborter = new AbortController();

    const p = req('/slow', { retries: 0, timeoutMs: 30_000, signal: aborter.signal });
    aborter.abort();

    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it('cacheia GET com TTL e não refaz a chamada dentro da janela', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok200({ n: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    const req = createClient();
    const a   = await req('/list', { cacheTtlMs: 5_000 });
    const b   = await req('/list', { cacheTtlMs: 5_000 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('deduplica GETs concorrentes para o mesmo endpoint', async () => {
    vi.useRealTimers(); // Promise.all precisa de timers reais para este teste
    const fetchMock = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return ok200({ x: 1 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = createClient();
    const [a, b, c] = await Promise.all([
      req('/shared'),
      req('/shared'),
      req('/shared'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('requestClient — silent refresh 401', () => {

  it('401 → refresh ok → retry bem-sucedido', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(err(401))   // primeira chamada: 401
      .mockResolvedValueOnce(ok200({ protected: true })); // segunda: 200
    vi.stubGlobal('fetch', fetchMock);

    const onUnauthorized = vi.fn().mockResolvedValue('new-token');
    const req = createClient({ onUnauthorized });

    const result = await req('/protected', { retries: 0 });

    expect(result).toEqual({ protected: true });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('401 → refresh falha → lança SESSION_EXPIRED sem retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(err(401)));

    const onUnauthorized = vi.fn().mockResolvedValue(null); // refresh falhou
    const sessionEvents: string[] = [];
    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => sessionEvents.push((e as CustomEvent).type),
    });

    const req = createClient({ onUnauthorized });

    await expect(req('/secret', { retries: 0 })).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
      status: 401,
    });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(sessionEvents).toContain('viva360:session-expired');
  });

  it('401 → refresh ok → segundo 401 → SESSION_EXPIRED (token inválido)', async () => {
    // Servidor continua retornando 401 mesmo após refresh
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(err(401)));
    const onUnauthorized = vi.fn().mockResolvedValue('fresh-token');

    const events: string[] = [];
    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => events.push((e as CustomEvent).type),
    });

    const req = createClient({ onUnauthorized });
    await expect(req('/still-401', { retries: 0 })).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });

    // Refresh foi chamado, mas o retry ainda retornou 401 → expired
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(events).toContain('viva360:session-expired');
  });

  it('skipAuthRefresh: 401 não aciona refresh e lança imediatamente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(err(401)));
    const onUnauthorized = vi.fn();

    const req = createClient({ onUnauthorized });

    // Deve rejeitar, mas com erro de "Request Failed" ou status 401 sem SESSION_EXPIRED code
    await expect(
      req('/auth-endpoint', { retries: 0, skipAuthRefresh: true })
    ).rejects.toSatisfy((e: any) => e.code !== 'SESSION_EXPIRED');

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────────────────────────────────────

describe('requestClient — lock de concorrência (401 simultâneos)', () => {

  it('N requests com 401 simultâneos disparam apenas UM refresh', async () => {
    vi.useRealTimers();

    let callCount = 0;

    // Fetch: 401 na primeira chamada de cada request, 200 nas seguintes
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      // As 3 primeiras chamadas são os 401 simultâneos
      if (callCount <= 3) return err(401);
      return ok200({ n: callCount });
    });
    vi.stubGlobal('fetch', fetchMock);

    // onUnauthorized lento (simula latência de rede)
    const onUnauthorized = vi.fn().mockImplementation(() =>
      new Promise((r) => setTimeout(() => r('brand-new-token'), 30)),
    );

    const req = createClient({ onUnauthorized });

    const [a, b, c] = await Promise.all([
      req('/r1', { retries: 0 }),
      req('/r2', { retries: 0 }),
      req('/r3', { retries: 0 }),
    ]);

    // Refresh deve ter sido chamado EXATAMENTE 1 vez — não 3
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    // Todos devem ter recebido resultado após o retry
    expect(a).toMatchObject({ n: expect.any(Number) });
    expect(b).toMatchObject({ n: expect.any(Number) });
    expect(c).toMatchObject({ n: expect.any(Number) });
  });

  it('janela de reuso (4 s): request logo após refresh não dispara novo refresh', async () => {
    vi.useRealTimers();

    let fetchCallN = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      fetchCallN++;
      // Primeira chamada: 401; depois: 200
      if (fetchCallN === 1) return err(401);
      return ok200();
    }));

    const onUnauthorized = vi.fn().mockResolvedValue('token-novo');
    const req = createClient({ onUnauthorized });

    // Primeira request: passa pelo refresh
    await req('/a', { retries: 0 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    // Segunda request, 50 ms depois (bem dentro dos 4 s):
    // - fetch retorna 401
    // - acquireToken vê refreshedAt recente → não chama onUnauthorized novamente
    fetchCallN = 0; // reset para simular novo 401

    // Stub atualizado: 401 → 200
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(err(401))
      .mockResolvedValueOnce(ok200({ reused: true })));

    const result = await req('/b', { retries: 0 });

    expect(result).toEqual({ reused: true });
    // onUnauthorized ainda deve ter sido chamado apenas 1 vez no total
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('fora da janela de reuso: segundo refresh é disparado', async () => {
    vi.useRealTimers();

    let n = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      n++;
      if (n % 2 === 1) return err(401);
      return ok200();
    }));

    const onUnauthorized = vi.fn().mockResolvedValue('tok');
    const req = createClient({ onUnauthorized });

    // Primeiro ciclo: 401 → refresh
    await req('/x', { retries: 0 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    // Forja refreshedAt bem no passado (> 4 s)
    // Fazemos isso avançando o Date.now() manualmente via fakeTimers
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 5_000); // 5 s no futuro

    // Segundo ciclo: fora da janela → NOVO refresh
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(err(401))
      .mockResolvedValueOnce(ok200()));

    await req('/y', { retries: 0 });
    expect(onUnauthorized).toHaveBeenCalledTimes(2);
  });

  it('dois clientes independentes NÃO compartilham o lock', async () => {
    vi.useRealTimers();

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValue(err(401))); // ambos sempre 401

    const ua = vi.fn().mockResolvedValue(null);
    const ub = vi.fn().mockResolvedValue(null);

    const reqA = createClient({ onUnauthorized: ua });
    const reqB = createClient({ onUnauthorized: ub });

    await Promise.allSettled([
      reqA('/a', { retries: 0 }),
      reqB('/b', { retries: 0 }),
    ]);

    // Cada cliente tem seu próprio lock; ambos disparam um refresh
    expect(ua).toHaveBeenCalledTimes(1);
    expect(ub).toHaveBeenCalledTimes(1);
  });

});

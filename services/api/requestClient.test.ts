import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestClient } from './requestClient';

const makeAbortError = () => {
  const error = new Error('aborted') as Error & { name: string };
  error.name = 'AbortError';
  return error;
};

const createClient = (captureError = vi.fn()) =>
  createRequestClient({
    apiUrl: 'http://localhost:3001/api',
    getHeaders: () => ({ Authorization: 'Bearer token' }),
    retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
    isLikelyNetworkError: (message) => String(message || '').toLowerCase().includes('network'),
    captureError,
  });

describe('requestClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('respeita abort externo', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
      const signal = init?.signal;
      return new Promise((_resolve, reject) => {
        if (signal?.aborted) {
          reject(makeAbortError());
          return;
        }
        signal?.addEventListener('abort', () => reject(makeAbortError()), { once: true });
      });
    }));

    const captureError = vi.fn();
    const request = createClient(captureError);
    const aborter = new AbortController();
    const pending = request('/slow', { retries: 0, timeoutMs: 1000, signal: aborter.signal });
    aborter.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it('aborta por timeout quando request demora', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
      const signal = init?.signal;
      return new Promise((_resolve, reject) => {
        if (signal?.aborted) {
          reject(makeAbortError());
          return;
        }
        signal?.addEventListener('abort', () => reject(makeAbortError()), { once: true });
      });
    }));

    const captureError = vi.fn();
    const request = createClient(captureError);
    await expect(request('/timeout', { retries: 0, timeoutMs: 5 })).rejects.toMatchObject({ name: 'AbortError' });
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it('faz retry em status transitório e retorna sucesso', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'busy' }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const captureError = vi.fn();
    const request = createClient(captureError);
    const result = await request('/unstable', { retries: 1, retryDelayMs: 1, timeoutMs: 50 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
    expect(captureError).not.toHaveBeenCalled();
  });

  it('cacheia GET com TTL e evita nova chamada dentro da janela', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [1, 2] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const request = createClient();
    const first = await request('/cached', { cacheTtlMs: 1000 });
    const second = await request('/cached', { cacheTtlMs: 1000 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ items: [1, 2] });
    expect(second).toEqual({ items: [1, 2] });
  });

  it('deduplica chamadas GET concorrentes para o mesmo endpoint', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = createClient();
    const [a, b] = await Promise.all([
      request('/inflight', { dedupe: true }),
      request('/inflight', { dedupe: true }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
  });
});

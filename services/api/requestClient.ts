// ─── services/api/requestClient.ts ───────────────────────────────────────────
//
// Responsabilidades:
//   • Timeout por request com AbortController composto
//   • Retry exponencial (backoff 2^attempt) para 5xx / erros de rede
//   • Silent 401 → token refresh → retry (UMA vez por request)
//   • Lock de concorrência: N requests com 401 simultâneos compartilham
//     a MESMA Promise de refresh — zero double-refresh
//   • Janela de reuso (4 s): requests que chegam logo após refresh bem-sucedido
//     reutilizam o token sem nova chamada — cobre o gap de microtask entre
//     refreshPromise.finally() e os awaits dos concorrentes
//   • Guard de identidade: `.finally(() => { if (p === refreshPromise) p = null })`
//     evita que uma Promise antiga limpe uma mais nova durante picos
//   • Deduplicação de GET inflight (mesmo endpoint, mesma Promise)
//   • Cache TTL para GET
//   • Telemetria estruturada por request
//
// ─── Fluxo 401 ────────────────────────────────────────────────────────────────
//
//   Request A ──► 401 ──► acquireToken() ──► cria refreshPromise ──────┐
//   Request B ──► 401 ──► acquireToken() ──► awaits mesmo promise ──────┤
//   Request C ──► 401 ──► acquireToken() ──► awaits mesmo promise ──────┤
//                                                                        │
//                                                    refreshPromise resolve
//                                                                        │
//                          A, B, C recebem true ───────────────────────┘
//                          fazem retry; getHeaders() lê token novo
//
//   refreshedAt = now() → D, E chegam 200 ms depois (dentro de 4 s):
//     acquireToken() → reuse window → true imediato, sem rede
//
// ─────────────────────────────────────────────────────────────────────────────

import { requestTelemetry } from '../../lib/telemetry';

export type RequestClientDeps = {
  apiUrl: string;
  getHeaders: () => Record<string, string>;
  retryableStatusCodes: Set<number>;
  isLikelyNetworkError: (message?: string) => boolean;
  captureError: (error: unknown, context: { endpoint: string; purpose?: string }) => void;
  /**
   * Chamado em 401. Deve salvar o novo token no storage e retorná-lo,
   * ou retornar null se a sessão expirou definitivamente.
   * NÃO deve disparar eventos de sessão expirada — isso é papel do requestClient.
   */
  onUnauthorized?: (endpoint: string) => Promise<string | null>;
};

export type RequestOptions = RequestInit & {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  purpose?: string;
  cacheTtlMs?: number;
  cacheKey?: string;
  dedupe?: boolean;
  /** Desabilita silent-refresh. Usar em chamadas internas do próprio auth. */
  skipAuthRefresh?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const clonePayload = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

/** Sentinel: sinaliza 401 de executeAttempts → runRequest sem passar pela lógica de retry normal */
const AUTH_SENTINEL = Symbol('AUTH_NEEDED');
type AuthNeeded = { readonly _s: typeof AUTH_SENTINEL };
const mkAuthNeeded = (): AuthNeeded => ({ _s: AUTH_SENTINEL });
const isAuthNeeded = (e: unknown): e is AuthNeeded =>
  typeof e === 'object' && e !== null && (e as any)._s === AUTH_SENTINEL;

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createRequestClient = (deps: RequestClientDeps) => {
  const canRetryStatus = (s: number) => deps.retryableStatusCodes.has(s);
  const responseCache = new Map<string, { expiresAt: number; payload: unknown }>();
  const inflightGets = new Map<string, Promise<unknown>>();
  const circuitBreaker = new Map<string, { failures: number; lastFailure: number }>();

  const CIRCUIT_THRESHOLD = 5;
  const CIRCUIT_RESET_MS = 30_000;

  // ── Token refresh lock ─────────────────────────────────────────────────────
  let refreshPromise: Promise<string | null> | null = null;
  let refreshedAt = 0;
  const REUSE_WINDOW_MS = 4_000;

  /**
   * Garante que apenas UM refresh corre de cada vez.
   * - Retorna `true`  → token válido em localStorage (novo ou recente)
   * - Retorna `false` → refresh falhou, sessão expirada
   */
  const acquireToken = async (endpoint: string): Promise<boolean> => {
    if (!deps.onUnauthorized) return false;

    // Janela de reuso: refresh recente (< 4 s) — token já está no localStorage
    if (refreshedAt > 0 && Date.now() - refreshedAt < REUSE_WINDOW_MS) {
      return true;
    }

    // Cria ou reutiliza o refresh em andamento
    if (!refreshPromise) {
      const p = deps.onUnauthorized(endpoint).then(
        (token) => { if (token !== null) refreshedAt = Date.now(); return token; },
        () => null,
      );
      refreshPromise = p;
      // Guard de identidade: só limpa se ainda somos o refresh mais recente
      p.finally(() => { if (refreshPromise === p) refreshPromise = null; });
    }

    const token = await refreshPromise;
    // token null → refresh falhou; mas se refreshedAt foi atualizado por
    // um refresh CONCORRENTE que terminou com sucesso, ainda há token válido
    return token !== null || (refreshedAt > 0 && Date.now() - refreshedAt < REUSE_WINDOW_MS);
  };

  // ── Loop de tentativas ─────────────────────────────────────────────────────
  //
  // Comportamento de erro:
  //   401              → lança AuthNeeded imediatamente (sem retry, sem capture)
  //   AbortError       → NÃO retenta, SALVA em lastError para capture no final
  //   5xx / rede       → retenta com backoff, capture só no estouro
  //   outros 4xx       → sem retry, throw imediato via captureError

  const executeAttempts = async (
    endpoint: string,
    fetchOptions: RequestInit,
    opts: { retries: number; retryDelayMs: number; timeoutMs: number; purpose?: string; correlationId: string },
    externalSignal?: AbortSignal,
  ): Promise<unknown> => {
    const { retries, retryDelayMs, timeoutMs, purpose, correlationId } = opts;
    const method = String(fetchOptions.method || 'GET').toUpperCase();
    let lastError: unknown = null;

    // Circuit Breaker Check
    const domain = endpoint.split('/')[1] || 'global';
    const state = circuitBreaker.get(domain);
    if (state && state.failures >= CIRCUIT_THRESHOLD && Date.now() - state.lastFailure < CIRCUIT_RESET_MS) {
      throw Object.assign(new Error(`Circuito aberto para ${domain}. Tente novamente mais tarde.`), { status: 503, code: 'CIRCUIT_OPEN' });
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const relayAbort = () => controller.abort();

      if (externalSignal) {
        if (externalSignal.aborted) controller.abort();
        else externalSignal.addEventListener('abort', relayAbort, { once: true });
      }

      const t0 = Date.now();

      try {
        const response = await fetch(`${deps.apiUrl}${endpoint}`, {
          ...fetchOptions,
          credentials: fetchOptions.credentials ?? 'include',
          signal: controller.signal,
          headers: { ...deps.getHeaders(), ...fetchOptions.headers },
        });
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', relayAbort);

        // 401 → sinaliza ao nível acima; sem retry aqui
        if (response.status === 401) {
          requestTelemetry.record({ endpoint, method, status: 401, durationMs: Date.now() - t0, purpose, correlationId, error: 'unauthorized' });
          throw mkAuthNeeded();
        }

        // Erros não-OK
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          const message = body.error || response.statusText || 'Request Failed';
          const err = Object.assign(new Error(message), {
            status: response.status,
            code: typeof body.code === 'string' ? body.code : null,
            details: body,
          });
          if (attempt < retries && canRetryStatus(response.status)) {
            const jitter = Math.random() * 200;
            await wait((retryDelayMs * Math.pow(2, attempt)) + jitter);
            continue;
          }
          requestTelemetry.record({ endpoint, method, status: response.status, durationMs: Date.now() - t0, purpose, correlationId, error: message });
          throw err;
        }

        // Sucesso -> Reset Circuit
        const payload = await response.json();
        circuitBreaker.delete(domain);
        requestTelemetry.record({ endpoint, method, status: response.status, durationMs: Date.now() - t0, purpose, correlationId });
        return payload;

      } catch (err: any) {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', relayAbort);

        // Sentinel 401: propaga diretamente, sem capture
        if (isAuthNeeded(err)) throw err;

        // AbortError: não retenta — registra e sai do loop para capture
        if (err?.name === 'AbortError') {
          lastError = err;
          break;
        }

        lastError = err;
        const retryable = canRetryStatus(Number(err?.status || 0)) || deps.isLikelyNetworkError(err?.message);

        // Update Circuit
        if (!retryable || (err?.status && err.status >= 500)) {
          const cur = circuitBreaker.get(domain) || { failures: 0, lastFailure: 0 };
          circuitBreaker.set(domain, { failures: cur.failures + 1, lastFailure: Date.now() });
        }

        if (attempt < retries && retryable) {
          const jitter = Math.random() * 200;
          await wait((retryDelayMs * Math.pow(2, attempt)) + jitter);
          continue;
        }
      }
    }

    // Estouro de tentativas ou AbortError: captura telemetria e lança
    deps.captureError(lastError, { endpoint, purpose });
    requestTelemetry.record({
      endpoint, method, status: (lastError as any)?.status || 0,
      durationMs: 0, purpose, correlationId,
      error: lastError instanceof Error ? lastError.message : 'unknown',
    });
    throw lastError ?? new Error('Request Failed');
  };

  // ── Request principal ──────────────────────────────────────────────────────
  return async (endpoint: string, options: RequestOptions = {}) => {
    const {
      retries = 2,
      retryDelayMs = 350,
      timeoutMs = 10_000,
      purpose,
      cacheTtlMs = 0,
      cacheKey,
      dedupe = true,
      skipAuthRefresh = false,
      ...fetchOptions
    } = options;

    const method = String(fetchOptions.method || 'GET').toUpperCase();
    const isCacheable = method === 'GET';
    const resolvedKey = cacheKey || `${method}:${endpoint}`;
    const externalSignal = fetchOptions.signal as AbortSignal | undefined;
    const correlationId = requestTelemetry.newCorrelationId();
    const attemptOpts = { retries, retryDelayMs, timeoutMs, purpose, correlationId };

    // ── Cache TTL ────────────────────────────────────────────────────────────
    if (isCacheable && cacheTtlMs > 0) {
      const cached = responseCache.get(resolvedKey);
      if (cached && cached.expiresAt > Date.now()) {
        requestTelemetry.record({ endpoint, method, status: 200, durationMs: 0, purpose, correlationId, cacheHit: true });
        return clonePayload(cached.payload);
      }
      if (cached) responseCache.delete(resolvedKey);
    }

    const saveCache = (payload: unknown) => {
      if (isCacheable && cacheTtlMs > 0)
        responseCache.set(resolvedKey, { expiresAt: Date.now() + cacheTtlMs, payload });
    };

    const emitSessionExpired = () => {
      if (typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent('viva360:session-expired'));
    };

    const sessionExpiredError = (reason: string) =>
      Object.assign(new Error('Sessão expirada. Faça login novamente.'), {
        status: 401, code: 'SESSION_EXPIRED',
      });

    const runRequest = async (): Promise<unknown> => {
      // Primeira passagem
      try {
        const payload = await executeAttempts(endpoint, fetchOptions, attemptOpts, externalSignal);
        saveCache(payload);
        return payload;

      } catch (firstErr: any) {
        // 401 → tenta refresh, depois UMA segunda passagem
        if (isAuthNeeded(firstErr) && !skipAuthRefresh) {
          const ok = await acquireToken(endpoint);

          if (!ok) {
            const err = sessionExpiredError('refresh_failed');
            requestTelemetry.record({ endpoint, method, status: 401, durationMs: 0, purpose, correlationId, error: 'session_expired' });
            emitSessionExpired();
            throw err;
          }

          // Segunda passagem com token novo (getHeaders() já lê do localStorage)
          try {
            const payload = await executeAttempts(endpoint, fetchOptions, attemptOpts, externalSignal);
            saveCache(payload);
            return payload;

          } catch (retryErr: any) {
            if (isAuthNeeded(retryErr)) {
              // 401 mesmo após refresh → sessão definitivamente expirada
              const err = sessionExpiredError('still_401_after_refresh');
              requestTelemetry.record({ endpoint, method, status: 401, durationMs: 0, purpose, correlationId, error: 'session_expired_after_refresh' });
              emitSessionExpired();
              throw err;
            }
            throw retryErr;
          }
        }

        throw firstErr;
      }
    };

    // ── Deduplicação de GET inflight ─────────────────────────────────────────
    if (isCacheable && dedupe) {
      const inflight = inflightGets.get(resolvedKey);
      if (inflight) return clonePayload(await inflight);

      const pending = runRequest().finally(() => inflightGets.delete(resolvedKey));
      inflightGets.set(resolvedKey, pending);
      return clonePayload(await pending);
    }

    return runRequest();
  };
};

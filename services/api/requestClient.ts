// ─── requestClient.ts ────────────────────────────────────────────────────────
// Responsabilidades:
//   • Timeout por request com AbortController
//   • Retry exponencial para status 5xx/network
//   • Silent 401 → token refresh → retry (UMA vez por request)
//   • Deduplicação de GET inflight
//   • Cache TTL para GET
//   • Telemetria estruturada por request (timing, status, correlationId)
// ─────────────────────────────────────────────────────────────────────────────

import { requestTelemetry } from '../../lib/telemetry';

type RequestClientDeps = {
  apiUrl: string;
  getHeaders: () => Record<string, string>;
  retryableStatusCodes: Set<number>;
  isLikelyNetworkError: (message?: string) => boolean;
  captureError: (error: unknown, context: { endpoint: string; purpose?: string }) => void;
  /** Chamado em 401 — deve tentar refresh do token e retornar o novo token,
   *  ou null se o refresh falhou (sessão expirada definitivamente). */
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
  /** Desabilita o silent-refresh para evitar loop em chamadas do próprio auth */
  skipAuthRefresh?: boolean;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clonePayload = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export const createRequestClient = (deps: RequestClientDeps) => {
  const shouldRetryResponse = (status: number) => deps.retryableStatusCodes.has(status);
  const responseCache = new Map<string, { expiresAt: number; payload: unknown }>();
  const inflightRequests = new Map<string, Promise<unknown>>();

  // ── 401 refresh serialization ─────────────────────────────────────────────
  // Garante que apenas UM refresh corre de cada vez — requests simultâneos com
  // 401 esperam o mesmo refresh em vez de disparar vários ao mesmo tempo.
  let refreshPromise: Promise<string | null> | null = null;

  const getRefreshedToken = (): Promise<string | null> => {
    if (!deps.onUnauthorized) return Promise.resolve(null);
    if (!refreshPromise) {
      refreshPromise = deps.onUnauthorized('__refresh__')
        .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  };

  return async (endpoint: string, options: RequestOptions = {}) => {
    const {
      retries = 2,
      retryDelayMs = 350,
      timeoutMs = 10000,
      purpose,
      cacheTtlMs = 0,
      cacheKey,
      dedupe = true,
      skipAuthRefresh = false,
      ...fetchOptions
    } = options;
    const method = String(fetchOptions.method || 'GET').toUpperCase();
    const isCacheable = method === 'GET';
    const resolvedCacheKey = cacheKey || `${method}:${endpoint}`;
    const externalSignal = fetchOptions.signal;
    const correlationId = requestTelemetry.newCorrelationId();

    if (isCacheable && cacheTtlMs > 0) {
      const cached = responseCache.get(resolvedCacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        requestTelemetry.record({ endpoint, method, status: 200, durationMs: 0, purpose, correlationId, cacheHit: true });
        return clonePayload(cached.payload);
      }
      if (cached) responseCache.delete(resolvedCacheKey);
    }

    const runRequest = async () => {
      let lastError: unknown = null;
      let didRefresh = false;

      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
        const onExternalAbort = () => controller.abort();
        if (externalSignal) {
          if (externalSignal.aborted) { controller.abort(); }
          else { externalSignal.addEventListener('abort', onExternalAbort, { once: true }); }
        }

        const startMs = Date.now();

        try {
          const response = await fetch(`${deps.apiUrl}${endpoint}`, {
            ...fetchOptions,
            credentials: fetchOptions.credentials ?? 'include',
            signal: controller.signal,
            headers: { ...deps.getHeaders(), ...fetchOptions.headers },
          });
          clearTimeout(timeoutHandle);
          if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

          // ── Silent 401 refresh ──────────────────────────────────────────
          if (response.status === 401 && !skipAuthRefresh && !didRefresh && deps.onUnauthorized) {
            didRefresh = true;
            const newToken = await getRefreshedToken();
            if (newToken) {
              // Retry imediato com novo token (não conta como attempt de retry)
              attempt -= 1;
              continue;
            }
            // Refresh falhou — sessão expirou definitivamente
            const authError = new Error('Sessão expirada. Faça login novamente.');
            (authError as any).status = 401;
            (authError as any).code = 'SESSION_EXPIRED';
            requestTelemetry.record({ endpoint, method, status: 401, durationMs: Date.now() - startMs, purpose, correlationId, error: 'session_expired' });
            throw authError;
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.error || response.statusText || 'API Request Failed';
            const error = new Error(message);
            (error as any).status = response.status;
            (error as any).code = typeof errorData.code === 'string' ? errorData.code : null;
            (error as any).details = errorData;
            if (attempt < retries && shouldRetryResponse(response.status)) {
              await wait(retryDelayMs * (attempt + 1));
              continue;
            }
            requestTelemetry.record({ endpoint, method, status: response.status, durationMs: Date.now() - startMs, purpose, correlationId, error: message });
            throw error;
          }

          const payload = await response.json();
          requestTelemetry.record({ endpoint, method, status: response.status, durationMs: Date.now() - startMs, purpose, correlationId });

          if (isCacheable && cacheTtlMs > 0) {
            responseCache.set(resolvedCacheKey, { expiresAt: Date.now() + cacheTtlMs, payload });
          }
          return payload;

        } catch (error: any) {
          clearTimeout(timeoutHandle);
          if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

          // Não retenta 401 resolvido acima ou erros de sessão expirada
          if (error?.code === 'SESSION_EXPIRED') throw error;

          lastError = error;
          const aborted = error?.name === 'AbortError';
          const status = Number(error?.status || 0);
          const retryable = aborted || shouldRetryResponse(status) || deps.isLikelyNetworkError(error?.message);
          if (attempt < retries && retryable) {
            await wait(retryDelayMs * (attempt + 1));
            continue;
          }
        }
      }

      deps.captureError(lastError, { endpoint, purpose });
      requestTelemetry.record({
        endpoint, method, status: (lastError as any)?.status || 0,
        durationMs: 0, purpose, correlationId,
        error: lastError instanceof Error ? lastError.message : 'unknown',
      });
      throw lastError || new Error('API Request Failed');
    };

    if (isCacheable && dedupe) {
      const inflight = inflightRequests.get(resolvedCacheKey);
      if (inflight) return clonePayload(await inflight);

      const pending = runRequest().finally(() => { inflightRequests.delete(resolvedCacheKey); });
      inflightRequests.set(resolvedCacheKey, pending);
      return clonePayload(await pending);
    }

    return runRequest();
  };
};

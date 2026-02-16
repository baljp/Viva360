type RequestClientDeps = {
  apiUrl: string;
  getHeaders: () => Record<string, string>;
  retryableStatusCodes: Set<number>;
  isLikelyNetworkError: (message?: string) => boolean;
  captureError: (error: unknown, context: { endpoint: string; purpose?: string }) => void;
};

export type RequestOptions = RequestInit & {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  purpose?: string;
  cacheTtlMs?: number;
  cacheKey?: string;
  dedupe?: boolean;
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

  return async (endpoint: string, options: RequestOptions = {}) => {
    const {
      retries = 2,
      retryDelayMs = 350,
      timeoutMs = 10000,
      purpose,
      cacheTtlMs = 0,
      cacheKey,
      dedupe = true,
      ...fetchOptions
    } = options;
    const method = String(fetchOptions.method || 'GET').toUpperCase();
    const isCacheable = method === 'GET';
    const resolvedCacheKey = cacheKey || `${method}:${endpoint}`;
    const externalSignal = fetchOptions.signal;

    if (isCacheable && cacheTtlMs > 0) {
      const cached = responseCache.get(resolvedCacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return clonePayload(cached.payload);
      }
      if (cached) responseCache.delete(resolvedCacheKey);
    }

    const runRequest = async () => {
    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
      const onExternalAbort = () => controller.abort();
      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort();
        } else {
          externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }
      }

      try {
        const response = await fetch(`${deps.apiUrl}${endpoint}`, {
          ...fetchOptions,
          signal: controller.signal,
          headers: { ...deps.getHeaders(), ...fetchOptions.headers },
        });
        clearTimeout(timeoutHandle);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

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
          throw error;
        }

        const payload = await response.json();
        if (isCacheable && cacheTtlMs > 0) {
          responseCache.set(resolvedCacheKey, {
            expiresAt: Date.now() + cacheTtlMs,
            payload,
          });
        }
        return payload;
      } catch (error: any) {
        clearTimeout(timeoutHandle);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
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
    throw lastError || new Error('API Request Failed');
    };

    if (isCacheable && dedupe) {
      const inflight = inflightRequests.get(resolvedCacheKey);
      if (inflight) {
        return clonePayload(await inflight);
      }

      const pending = runRequest().finally(() => {
        inflightRequests.delete(resolvedCacheKey);
      });
      inflightRequests.set(resolvedCacheKey, pending);
      return clonePayload(await pending);
    }

    return runRequest();
  };
};

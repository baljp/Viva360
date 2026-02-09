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
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createRequestClient = (deps: RequestClientDeps) => {
  const shouldRetryResponse = (status: number) => deps.retryableStatusCodes.has(status);

  return async (endpoint: string, options: RequestOptions = {}) => {
    const {
      retries = 2,
      retryDelayMs = 350,
      timeoutMs = 10000,
      purpose,
      ...fetchOptions
    } = options;

    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${deps.apiUrl}${endpoint}`, {
          ...fetchOptions,
          signal: controller.signal,
          headers: { ...deps.getHeaders(), ...fetchOptions.headers },
        });
        clearTimeout(timeoutHandle);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.error || response.statusText || 'API Request Failed';
          const error = new Error(message);
          (error as any).status = response.status;
          if (attempt < retries && shouldRetryResponse(response.status)) {
            await wait(retryDelayMs * (attempt + 1));
            continue;
          }
          throw error;
        }

        return response.json();
      } catch (error: any) {
        clearTimeout(timeoutHandle);
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
};


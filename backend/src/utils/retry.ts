/**
 * Retry Utility with Exponential Backoff
 * Robustness: Automatically retry failed operations with increasing delays
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryCondition' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 200,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Execute a function with automatic retry and exponential backoff
 * 
 * @example
 * const result = await withRetry(
 *   () => emailService.send(email),
 *   { maxAttempts: 3, onRetry: (n, e) => console.log(`Retry ${n}: ${e.message}`) }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (opts.retryCondition && !opts.retryCondition(lastError)) {
        throw lastError;
      }

      // Don't retry if this was the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Calculate delay with jitter (±10%)
      const jitter = delay * 0.1 * (Math.random() * 2 - 1);
      const actualDelay = Math.min(delay + jitter, opts.maxDelayMs);

      // Notify retry callback
      if (opts.onRetry) {
        opts.onRetry(attempt, lastError, actualDelay);
      }

      // Wait before next attempt
      await sleep(actualDelay);

      // Increase delay for next attempt
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Promise-based sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry decorator for class methods
 */
export function Retry(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Check if error is retryable (network errors, timeouts, 5xx responses)
 */
export function isRetryableError(error: Error): boolean {
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE'];
  const retryableMessages = ['network', 'timeout', 'socket hang up'];

  // Check error code
  if ('code' in error && retryableCodes.includes((error as any).code)) {
    return true;
  }

  // Check error message
  const message = error.message.toLowerCase();
  if (retryableMessages.some(m => message.includes(m))) {
    return true;
  }

  // Check HTTP status codes (5xx are retryable)
  if ('status' in error) {
    const status = (error as any).status;
    if (status >= 500 && status < 600) {
      return true;
    }
  }

  return false;
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const RESERVED_TOP_LEVEL_KEYS = new Set(['level', 'message', 'timestamp']);

const normalizeLevel = (value: unknown): LogLevel | null => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'error' || v === 'warn' || v === 'info' || v === 'debug') return v;
  return null;
};

const defaultLevel = (): LogLevel => {
  if (process.env.NODE_ENV === 'production') return 'warn';
  return 'info';
};

const effectiveLevel: LogLevel =
  normalizeLevel(process.env.LOG_LEVEL) || defaultLevel();

const shouldLog = (level: LogLevel): boolean => {
  return LEVELS[level] <= LEVELS[effectiveLevel];
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT_RE = /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9._-]{10,}\.[a-zA-Z0-9._-]{10,}\b/g;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._-]{10,}\b/g;

const SENSITIVE_KEY_RE =
  /(pass(word)?|authorization|cookie|set-cookie|token|access[_-]?token|refresh[_-]?token|jwt|secret|api[_-]?key|service[_-]?role|prontu[aá]rio|record|clinical|content|note|email)/i;

const redactString = (input: string): string => {
  return input
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(JWT_RE, '[REDACTED_JWT]')
    .replace(BEARER_RE, 'Bearer [REDACTED_TOKEN]');
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
};

const redactValue = (value: unknown, depth: number, seen: WeakSet<object>): unknown => {
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'function') return '[Function]';

  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);

    if (Array.isArray(value)) {
      if (depth <= 0) return '[Array]';
      return value.slice(0, 50).map((item) => redactValue(item, depth - 1, seen));
    }

    if (isPlainObject(value)) {
      if (depth <= 0) return '[Object]';
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (SENSITIVE_KEY_RE.test(k)) {
          out[k] = '[REDACTED]';
        } else {
          out[k] = redactValue(v, depth - 1, seen);
        }
      }
      return out;
    }

    // Error objects and others: capture a safe subset.
    if (value instanceof Error) {
      return {
        name: value.name,
        message: redactString(value.message || ''),
        stack: process.env.NODE_ENV === 'production' ? undefined : value.stack,
      };
    }

    try {
      return redactValue(JSON.parse(JSON.stringify(value)), depth - 1, seen);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const safePayload = (level: LogLevel, message: string, meta?: unknown) => {
  const base = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  if (meta === undefined) return base;
  const redacted = redactValue(meta, 6, new WeakSet());
  if (isPlainObject(redacted)) {
    // Prevent callers from overwriting reserved log envelope fields.
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(redacted)) {
      if (RESERVED_TOP_LEVEL_KEYS.has(k)) continue;
      cleaned[k] = v;
    }
    return { ...base, ...cleaned };
  }
  return { ...base, meta: redacted };
};

const emit = (level: LogLevel, message: string, meta?: unknown) => {
  if (!shouldLog(level)) return;
  try {
    const payload = safePayload(level, message, meta);
    const line = JSON.stringify(payload);
    if (level === 'error') return console.error(line);
    if (level === 'warn') return console.warn(line);
    return console.log(line);
  } catch (e) {
    // Last resort (also redacted best-effort)
    const fallback = {
      level,
      message: redactString(String(message || '')),
      timestamp: new Date().toISOString(),
      meta: typeof meta === 'string' ? redactString(meta) : undefined,
      error: e instanceof Error ? redactString(e.message) : undefined,
    };
    const line = JSON.stringify(fallback);
    if (level === 'error') return console.error(line);
    if (level === 'warn') return console.warn(line);
    return console.log(line);
  }
};

export const logger = {
  info: (message: string, meta?: unknown) => emit('info', message, meta),
  warn: (message: string, meta?: unknown) => emit('warn', message, meta),
  error: (message: string, meta?: unknown) => emit('error', message, meta),
  debug: (message: string, meta?: unknown) => emit('debug', message, meta),
};

// ─── lib/telemetry.ts ─────────────────────────────────────────────────────────
// Telemetria estruturada mínima do Viva360.
//
// O que registra:
//   • Cada request HTTP: endpoint, método, status, timing, correlationId
//   • Erros frontend: tipo, mensagem, stack, contexto (userId, sessionId)
//   • Eventos de sessão: login, logout, refresh de token
//   • Buffer em memória (últimos 500 eventos) + aggregate persistido em localStorage
//
// Como usar no console do browser:
//   window.__VIVA360_TELEMETRY__()           → exporta snapshot JSON
//   window.__VIVA360_TELEMETRY_DOWNLOAD__()  → baixa viva360-telemetry-TIMESTAMP.json
//   window.__VIVA360_TELEMETRY_ERRORS__()    → lista só os erros recentes
//
// Plugue Sentry/Datadog futuramente:
//   Substitua os `console.*` em `flushToExternal` ou adicione transportes em
//   `TELEMETRY_TRANSPORTS` sem mudar o restante do código.
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_ID = Math.random().toString(36).slice(2, 10).toUpperCase();
const STORAGE_KEY = 'viva360.telemetry.aggregate';
const MAX_EVENTS = 500;

let _userId: string | null = null;
let _correlationCounter = 0;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type TelemetryEventKind =
  | 'request'
  | 'error'
  | 'session'
  | 'flow'
  | 'round_trip';

export type RequestTelemetryEntry = {
  kind: 'request';
  at: string;
  sessionId: string;
  userId: string | null;
  correlationId: string;
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  purpose?: string;
  cacheHit?: boolean;
  error?: string;
};

export type ErrorTelemetryEntry = {
  kind: 'error';
  at: string;
  sessionId: string;
  userId: string | null;
  correlationId: string;
  message: string;
  stack?: string;
  domain?: string;
  op?: string;
  context?: Record<string, unknown>;
};

export type SessionTelemetryEntry = {
  kind: 'session';
  at: string;
  sessionId: string;
  userId: string | null;
  correlationId: string;
  event: 'login' | 'logout' | 'token_refresh_ok' | 'token_refresh_fail' | 'session_expired';
  meta?: Record<string, unknown>;
};

export type RoundTripEntry = {
  kind: 'round_trip';
  at: string;
  sessionId: string;
  userId: string | null;
  correlationId: string;
  flow: string;
  action: string;
  status: 'start' | 'success' | 'error';
  durationMs?: number;
  error?: string;
};

export type TelemetryEntry =
  | RequestTelemetryEntry
  | ErrorTelemetryEntry
  | SessionTelemetryEntry
  | RoundTripEntry;

// ─── Aggregate (persistido em localStorage) ──────────────────────────────────

type TelemetryAggregate = {
  sessions: number;
  totalRequests: number;
  totalErrors: number;
  p50Ms: number;
  p95Ms: number;
  errorsByEndpoint: Record<string, number>;
  slowestEndpoints: Array<{ endpoint: string; avgMs: number; calls: number }>;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  updatedAt: string;
};

const emptyAggregate = (): TelemetryAggregate => ({
  sessions: 1,
  totalRequests: 0,
  totalErrors: 0,
  p50Ms: 0,
  p95Ms: 0,
  errorsByEndpoint: {},
  slowestEndpoints: [],
  updatedAt: new Date().toISOString(),
});

// ─── Buffer em memória ───────────────────────────────────────────────────────

const events: TelemetryEntry[] = [];
const requestDurations: number[] = [];
const endpointStats: Record<string, { totalMs: number; calls: number; errors: number }> = {};

const pushEvent = (entry: TelemetryEntry) => {
  events.push(entry);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
};

// ─── Aggregate helpers ───────────────────────────────────────────────────────

const percentile = (sorted: number[], p: number) => {
  if (!sorted.length) return 0;
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const aggregate: TelemetryAggregate = (() => {
  try {
    if (typeof localStorage === 'undefined') return emptyAggregate();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAggregate();
    const parsed = JSON.parse(raw) as TelemetryAggregate;
    parsed.sessions = (parsed.sessions || 0) + 1;
    return parsed;
  } catch { return emptyAggregate(); }
})();

const schedulePersist = () => {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(aggregate)); } catch { /* quota */ }
  }, 2000);
};

const updateAggregate = (entry: TelemetryEntry) => {
  if (entry.kind === 'request') {
    aggregate.totalRequests += 1;
    if (entry.durationMs > 0 && !entry.cacheHit) {
      requestDurations.push(entry.durationMs);
      const sorted = [...requestDurations].sort((a, b) => a - b);
      aggregate.p50Ms = percentile(sorted, 50);
      aggregate.p95Ms = percentile(sorted, 95);

      const key = `${entry.method} ${entry.endpoint}`;
      const s = endpointStats[key] || { totalMs: 0, calls: 0, errors: 0 };
      s.calls += 1;
      s.totalMs += entry.durationMs;
      if (entry.error) { s.errors += 1; aggregate.errorsByEndpoint[key] = (aggregate.errorsByEndpoint[key] || 0) + 1; }
      endpointStats[key] = s;

      // Top 10 slowest
      aggregate.slowestEndpoints = Object.entries(endpointStats)
        .map(([ep, st]) => ({ endpoint: ep, avgMs: Math.round(st.totalMs / st.calls), calls: st.calls }))
        .sort((a, b) => b.avgMs - a.avgMs)
        .slice(0, 10);
    }
    if (entry.error) {
      aggregate.totalErrors += 1;
      aggregate.lastErrorAt = entry.at;
      aggregate.lastErrorMessage = `${entry.method} ${entry.endpoint}: ${entry.error}`;
    }
  }
  if (entry.kind === 'error') {
    aggregate.totalErrors += 1;
    aggregate.lastErrorAt = entry.at;
    aggregate.lastErrorMessage = entry.message;
  }
  aggregate.updatedAt = entry.at;
  schedulePersist();
};

// ─── Dev console output ──────────────────────────────────────────────────────

const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

const devLog = (entry: TelemetryEntry) => {
  if (!isDev) return;
  if (entry.kind === 'request') {
    const ok = !entry.error && entry.status >= 200 && entry.status < 300;
    const slow = entry.durationMs > 2000;
    const icon = entry.cacheHit ? '📦' : ok ? (slow ? '🐢' : '✅') : '❌';
    const msg = `${icon} [${entry.method}] ${entry.endpoint} → ${entry.status} (${entry.durationMs}ms)`;
    if (!ok) console.warn('[Telemetry:request]', msg, entry);
    // Request ok: silencioso em dev, não polui console
  }
  if (entry.kind === 'error') {
    console.error('[Telemetry:error]', entry.message, entry.context || {});
  }
  if (entry.kind === 'session') {
    const icons: Record<string, string> = { login: '🔑', logout: '🚪', token_refresh_ok: '🔄✅', token_refresh_fail: '🔄❌', session_expired: '⏰' };
    console.info(`[Telemetry:session] ${icons[entry.event] || ''} ${entry.event}`, entry.meta || {});
  }
  if (entry.kind === 'round_trip') {
    const icon = entry.status === 'success' ? '🔁✅' : entry.status === 'error' ? '🔁❌' : '🔁⏳';
    console.info(`[Telemetry:round_trip] ${icon} ${entry.flow}.${entry.action}`, entry);
  }
};

// ─── API pública ─────────────────────────────────────────────────────────────

export const telemetry = {
  /** Registra o userId ativo para enriquecer todos os eventos seguintes */
  setUser: (userId: string | null) => { _userId = userId; },

  record: (entry: Omit<TelemetryEntry, 'at' | 'sessionId' | 'userId'>) => {
    const full: TelemetryEntry = {
      ...entry,
      at: new Date().toISOString(),
      sessionId: SESSION_ID,
      userId: _userId,
    } as TelemetryEntry;
    pushEvent(full);
    updateAggregate(full);
    devLog(full);
  },

  /** Exporta snapshot completo para debugging */
  export: () => ({
    version: 2,
    sessionId: SESSION_ID,
    userId: _userId,
    generatedAt: new Date().toISOString(),
    aggregate,
    recentEvents: [...events].slice(-200),
  }),

  /** Retorna só os erros recentes */
  errors: () => events.filter(e => e.kind === 'error' || (e.kind === 'request' && (e as RequestTelemetryEntry).error)),

  /** Download JSON para análise off-line */
  download: () => {
    const payload = telemetry.export();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `viva360-telemetry-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  },
};

// ─── requestTelemetry — API simplificada para o requestClient ────────────────
export const requestTelemetry = {
  newCorrelationId: () => `${SESSION_ID}-${(++_correlationCounter).toString(36).toUpperCase()}`,

  record: (opts: {
    endpoint: string; method: string; status: number; durationMs: number;
    purpose?: string; correlationId: string; cacheHit?: boolean; error?: string;
  }) => {
    telemetry.record({
      kind: 'request',
      correlationId: opts.correlationId,
      method: opts.method,
      endpoint: opts.endpoint,
      status: opts.status,
      durationMs: opts.durationMs,
      purpose: opts.purpose,
      cacheHit: opts.cacheHit,
      error: opts.error,
    } as RequestTelemetryEntry);
  },
};

// ─── errorTelemetry — substitui captureFrontendError ─────────────────────────
export const errorTelemetry = {
  capture: (error: unknown, context?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : String(error || 'unknown');
    const stack = error instanceof Error ? error.stack : undefined;
    telemetry.record({
      kind: 'error',
      correlationId: requestTelemetry.newCorrelationId(),
      message,
      stack,
      domain: context?.domain as string,
      op: context?.op as string || context?.endpoint as string,
      context,
    } as ErrorTelemetryEntry);
  },
  captureMessage: (message: string, context?: Record<string, unknown>) => {
    // Mensagens não são erros — logamos só em dev
    if (isDev) console.info('[Telemetry:msg]', message, context || {});
  },
};

// ─── sessionTelemetry ────────────────────────────────────────────────────────
export const sessionTelemetry = {
  record: (event: SessionTelemetryEntry['event'], meta?: Record<string, unknown>) => {
    telemetry.record({
      kind: 'session',
      correlationId: requestTelemetry.newCorrelationId(),
      event,
      meta,
    } as SessionTelemetryEntry);
  },
};

// ─── roundTripTelemetry ──────────────────────────────────────────────────────
export const roundTripTelemetry = {
  start: (flow: string, action: string): { correlationId: string; startMs: number } => {
    const correlationId = requestTelemetry.newCorrelationId();
    telemetry.record({ kind: 'round_trip', correlationId, flow, action, status: 'start' } as RoundTripEntry);
    return { correlationId, startMs: Date.now() };
  },
  success: (flow: string, action: string, correlationId: string, startMs: number) => {
    telemetry.record({ kind: 'round_trip', correlationId, flow, action, status: 'success', durationMs: Date.now() - startMs } as RoundTripEntry);
  },
  error: (flow: string, action: string, correlationId: string, startMs: number, error: string) => {
    telemetry.record({ kind: 'round_trip', correlationId, flow, action, status: 'error', durationMs: Date.now() - startMs, error } as RoundTripEntry);
  },
};

// ─── Browser globals para debugging ─────────────────────────────────────────
declare global {
  interface Window {
    __VIVA360_TELEMETRY__?: () => ReturnType<typeof telemetry.export>;
    __VIVA360_TELEMETRY_DOWNLOAD__?: () => void;
    __VIVA360_TELEMETRY_ERRORS__?: () => TelemetryEntry[];
  }
}

if (typeof window !== 'undefined') {
  window.__VIVA360_TELEMETRY__ = () => telemetry.export();
  window.__VIVA360_TELEMETRY_DOWNLOAD__ = () => telemetry.download();
  window.__VIVA360_TELEMETRY_ERRORS__ = () => telemetry.errors();

  // Flush no unload
  window.addEventListener('pagehide', () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(aggregate)); } catch { /* quota */ }
  });
}

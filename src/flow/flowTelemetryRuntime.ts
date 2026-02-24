import type { FlowTelemetryEvent } from './flowTelemetry';

type AggregateCounters = {
  total: number;
  byProfile: Record<string, number>;
  byStatus: Record<string, number>;
  byFlowAction: Record<string, { total: number; success: number; error: number; stateChange: number; attempt: number; avgDurationMs?: number }>;
  lastErrorAt?: string;
  lastErrorMessage?: string;
};

type FlowTelemetryExport = {
  generatedAt: string;
  version: 1;
  summary: AggregateCounters;
  recentEvents: FlowTelemetryEvent[];
};

declare global {
  interface Window {
    __VIVA360_FLOW_TELEMETRY_AGG__?: AggregateCounters;
    __VIVA360_GET_FLOW_TELEMETRY_EXPORT__?: () => FlowTelemetryExport;
    __VIVA360_DOWNLOAD_FLOW_TELEMETRY__?: () => void;
    __VIVA360_FLOW_TELEMETRY_RUNTIME_INSTALLED__?: boolean;
  }
}

const STORAGE_KEY = 'viva360.flow_telemetry.aggregate';
const MAX_RECENT_EVENTS = 300;

const emptyCounters = (): AggregateCounters => ({
  total: 0,
  byProfile: {},
  byStatus: {},
  byFlowAction: {},
});

const getRecentEvents = (): FlowTelemetryEvent[] => {
  if (typeof window === 'undefined') return [];
  return Array.isArray(window.__VIVA360_FLOW_TELEMETRY__) ? window.__VIVA360_FLOW_TELEMETRY__ : [];
};

const readStoredAggregate = (): AggregateCounters | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...emptyCounters(),
      ...parsed,
      byProfile: parsed.byProfile || {},
      byStatus: parsed.byStatus || {},
      byFlowAction: parsed.byFlowAction || {},
    };
  } catch {
    return null;
  }
};

const persistAggregate = (agg: AggregateCounters) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agg));
  } catch {
    // ignore quota/storage failures
  }
};

const flowActionKey = (event: FlowTelemetryEvent) => `${event.profile}:${event.flow}:${event.action}`;

const applyEvent = (agg: AggregateCounters, event: FlowTelemetryEvent) => {
  agg.total += 1;
  agg.byProfile[event.profile] = (agg.byProfile[event.profile] || 0) + 1;
  agg.byStatus[event.status] = (agg.byStatus[event.status] || 0) + 1;

  const key = flowActionKey(event);
  const current = agg.byFlowAction[key] || { total: 0, success: 0, error: 0, stateChange: 0, attempt: 0 };
  current.total += 1;
  if (event.status === 'success') current.success += 1;
  if (event.status === 'error') current.error += 1;
  if (event.status === 'state_change') current.stateChange += 1;
  if (event.status === 'attempt') current.attempt += 1;
  if (typeof event.durationMs === 'number' && Number.isFinite(event.durationMs)) {
    const samples = Math.max(current.success + current.error, 1);
    const prevAvg = typeof current.avgDurationMs === 'number' ? current.avgDurationMs : event.durationMs;
    current.avgDurationMs = Math.round(((prevAvg * (samples - 1)) + event.durationMs) / samples);
  }
  agg.byFlowAction[key] = current;

  if (event.status === 'error') {
    agg.lastErrorAt = event.at || new Date().toISOString();
    agg.lastErrorMessage = event.errorMessage || `${event.flow}.${event.action}`;
  }
};

const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const installFlowTelemetryRuntime = () => {
  if (typeof window === 'undefined') return;
  if (window.__VIVA360_FLOW_TELEMETRY_RUNTIME_INSTALLED__) return;
  window.__VIVA360_FLOW_TELEMETRY_RUNTIME_INSTALLED__ = true;

  const aggregate = readStoredAggregate() || emptyCounters();
  window.__VIVA360_FLOW_TELEMETRY_AGG__ = aggregate;

  let pendingFlush = 0;
  const flush = () => {
    persistAggregate(aggregate);
    pendingFlush = 0;
  };

  const onTelemetry = (evt: Event) => {
    const custom = evt as CustomEvent<FlowTelemetryEvent>;
    const detail = custom.detail;
    if (!detail) return;
    applyEvent(aggregate, detail);
    window.__VIVA360_FLOW_TELEMETRY_AGG__ = aggregate;
    pendingFlush += 1;
    if (pendingFlush >= 10) flush();
  };

  const onPageHide = () => flush();
  window.addEventListener('viva360:flow-telemetry', onTelemetry as EventListener);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('beforeunload', onPageHide);

  window.__VIVA360_GET_FLOW_TELEMETRY_EXPORT__ = () => ({
    generatedAt: new Date().toISOString(),
    version: 1,
    summary: window.__VIVA360_FLOW_TELEMETRY_AGG__ || aggregate,
    recentEvents: getRecentEvents().slice(-MAX_RECENT_EVENTS),
  });

  window.__VIVA360_DOWNLOAD_FLOW_TELEMETRY__ = () => {
    const payload = window.__VIVA360_GET_FLOW_TELEMETRY_EXPORT__?.();
    if (!payload) return;
    downloadJson(`viva360-flow-telemetry-${Date.now()}.json`, payload);
  };
};

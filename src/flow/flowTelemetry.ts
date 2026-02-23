import { captureFrontendError, captureFrontendMessage } from '../../lib/frontendLogger';

type FlowProfile = 'BUSCADOR' | 'GUARDIAO' | 'SANTUARIO';
type FlowStatus = 'attempt' | 'success' | 'error' | 'state_change';

export type FlowTelemetryEvent = {
  profile: FlowProfile;
  flow: string;
  action: string;
  status: FlowStatus;
  from?: string;
  to?: string;
  durationMs?: number;
  errorMessage?: string;
  meta?: Record<string, unknown>;
  at?: string;
};

declare global {
  interface Window {
    __VIVA360_FLOW_TELEMETRY__?: FlowTelemetryEvent[];
  }
}

const MAX_BUFFER = 300;

const pushToWindowBuffer = (event: FlowTelemetryEvent) => {
  if (typeof window === 'undefined') return;
  const list = window.__VIVA360_FLOW_TELEMETRY__ || [];
  list.push(event);
  if (list.length > MAX_BUFFER) list.splice(0, list.length - MAX_BUFFER);
  window.__VIVA360_FLOW_TELEMETRY__ = list;
  window.dispatchEvent(new CustomEvent('viva360:flow-telemetry', { detail: event }));
};

export const trackFlowTelemetry = (event: FlowTelemetryEvent) => {
  const payload: FlowTelemetryEvent = { ...event, at: new Date().toISOString() };
  pushToWindowBuffer(payload);

  const msg = `flow.${payload.profile.toLowerCase()}.${payload.flow}.${payload.action}.${payload.status}`;
  const context = {
    from: payload.from,
    to: payload.to,
    durationMs: payload.durationMs,
    errorMessage: payload.errorMessage,
    ...(payload.meta || {}),
  };

  if (payload.status === 'error') {
    captureFrontendError(new Error(payload.errorMessage || msg), { flowTelemetry: context, profile: payload.profile, flow: payload.flow });
    return;
  }

  captureFrontendMessage(msg, { profile: payload.profile, flow: payload.flow, ...context });
};


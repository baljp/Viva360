import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.MODE || "development";
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.2);
const replaysSessionSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0.01);
const replaysOnErrorSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 1);
const logrocketId = import.meta.env.VITE_LOGROCKET_APP_ID;

let initialized = false;

export const initMonitoring = () => {
    if (initialized) return;
    initialized = true;

    if (!dsn) {
        console.info("[Monitoring] Sentry DSN ausente. Observabilidade remota desativada.");
    } else {
        Sentry.init({
            dsn,
            environment,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.2,
            replaysSessionSampleRate: Number.isFinite(replaysSessionSampleRate) ? replaysSessionSampleRate : 0.01,
            replaysOnErrorSampleRate: Number.isFinite(replaysOnErrorSampleRate) ? replaysOnErrorSampleRate : 1,
        });
    }

    // LogRocket opcional por script externo/CDN sem dependência hard.
    if (logrocketId && typeof window !== 'undefined' && (window as any).LogRocket?.init) {
        try {
            (window as any).LogRocket.init(logrocketId);
        } catch (err) {
            console.warn("[Monitoring] Falha ao iniciar LogRocket", err);
        }
    }
};

export const captureFrontendError = (error: unknown, context?: Record<string, unknown>) => {
    if (dsn) {
        Sentry.captureException(error, { extra: context });
    }
    if (context) {
        console.error("[FrontendError]", error, context);
        return;
    }
    console.error("[FrontendError]", error);
};

export const captureFrontendMessage = (message: string, context?: Record<string, unknown>) => {
    if (dsn) {
        Sentry.captureMessage(message, { level: "warning", extra: context });
    }
    console.warn("[FrontendMessage]", message, context || {});
};

export const setMonitoringUser = (user: { id?: string; email?: string; role?: string } | null) => {
    if (!dsn) return;
    if (!user) {
        Sentry.setUser(null);
        return;
    }
    Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
    });
};

declare global {
    interface Window {
        LogRocket?: {
            init: (appId: string) => void;
        };
    }
}

// Backward-compatible noop initialization signature preserved.
export const initMonitoringLegacy = () => {
    Sentry.init({
        dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0, 
        replaysSessionSampleRate: 0.1, 
        replaysOnErrorSampleRate: 1.0,
    });
};

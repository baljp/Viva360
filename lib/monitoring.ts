const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.MODE || "development";
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.2);
const replaysSessionSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0.01);
const replaysOnErrorSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 1);
const logrocketId = import.meta.env.VITE_LOGROCKET_APP_ID;
const enableTracing = String(import.meta.env.VITE_SENTRY_ENABLE_TRACING ?? 'true').toLowerCase() !== 'false';
const enableReplay = String(import.meta.env.VITE_SENTRY_ENABLE_REPLAY ?? 'false').toLowerCase() === 'true';

let initialized = false;
let sentryModule: typeof import("@sentry/react") | null = null;

const getSentry = async () => {
    if (!sentryModule) {
        sentryModule = await import("@sentry/react");
    }
    return sentryModule;
};

export const initMonitoring = async () => {
    if (initialized) return;
    initialized = true;

    if (!dsn) {
        console.info("[Monitoring] Sentry DSN ausente. Observabilidade remota desativada.");
    } else {
        const Sentry = await getSentry();
        const activeSampleRate = Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.2;
        const enforcedSampleRate = environment === 'production' ? Math.max(activeSampleRate, 0.1) : activeSampleRate;
        const integrations: any[] = [];
        if (enableTracing) {
            integrations.push(Sentry.browserTracingIntegration());
        }
        if (enableReplay) {
            integrations.push(Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }));
        }

        Sentry.init({
            dsn,
            environment,
            release: import.meta.env.VITE_APP_VERSION || undefined,
            integrations,
            tracesSampleRate: enableTracing ? enforcedSampleRate : 0,
            replaysSessionSampleRate: enableReplay && Number.isFinite(replaysSessionSampleRate) ? replaysSessionSampleRate : 0,
            replaysOnErrorSampleRate: enableReplay && Number.isFinite(replaysOnErrorSampleRate) ? replaysOnErrorSampleRate : 0,
            // Ignore known noise
            ignoreErrors: [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
                /Loading chunk \d+ failed/,
            ],
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
    if (dsn && sentryModule) {
        sentryModule.captureException(error, { extra: context });
    }
    if (context) {
        console.error("[FrontendError]", error, context);
        return;
    }
    console.error("[FrontendError]", error);
};

export const captureFrontendMessage = (message: string, context?: Record<string, unknown>) => {
    if (dsn && sentryModule) {
        sentryModule.captureMessage(message, { level: "warning", extra: context });
    }
    console.warn("[FrontendMessage]", message, context || {});
};

export const setMonitoringUser = (user: { id?: string; email?: string; role?: string } | null) => {
    if (!dsn || !sentryModule) return;
    if (!user) {
        sentryModule.setUser(null);
        return;
    }
    sentryModule.setUser({
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

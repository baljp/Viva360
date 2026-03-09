import { errorTelemetry } from './telemetry';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.MODE || "development";
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.2);
const replaysSessionSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0.01);
const replaysOnErrorSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 1);
const logrocketId = import.meta.env.VITE_LOGROCKET_APP_ID;
const enableTracing = String(import.meta.env.VITE_SENTRY_ENABLE_TRACING ?? 'true').toLowerCase() !== 'false';
const enableReplay = String(import.meta.env.VITE_SENTRY_ENABLE_REPLAY ?? 'false').toLowerCase() === 'true';

let initialized = false;
let sentryModule: typeof import("@sentry/browser") | null = null;
type LogRocketWindow = Window & {
    LogRocket?: {
        init: (appId: string) => void;
    };
};

const getSentry = async () => {
    if (!sentryModule) {
        sentryModule = await import("@sentry/browser");
    }
    return sentryModule;
};

export const initMonitoring = async () => {
    if (initialized) return;
    initialized = true;

    if (!dsn) {
        errorTelemetry.captureMessage('monitoring.sentry.disabled', { domain: 'monitoring', op: 'initMonitoring' });
        (window as unknown as Record<string, unknown>).__VIVA360_SENTRY__ = false;
    } else {
        const Sentry = await getSentry();
        const activeSampleRate = Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.2;
        const enforcedSampleRate = environment === 'production' ? Math.max(activeSampleRate, 0.1) : activeSampleRate;
        const integrations: Array<
            ReturnType<typeof Sentry.browserTracingIntegration> |
            ReturnType<typeof Sentry.replayIntegration>
        > = [];
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
        (window as unknown as Record<string, unknown>).__VIVA360_SENTRY__ = true;
    }

    // LogRocket opcional por script externo/CDN sem dependência hard.
    const logRocketWindow = typeof window !== 'undefined' ? (window as LogRocketWindow) : null;
    if (logrocketId && logRocketWindow?.LogRocket?.init) {
        try {
            logRocketWindow.LogRocket.init(logrocketId);
        } catch (err) {
            errorTelemetry.capture(err, { domain: 'monitoring', op: 'logrocket.init' });
        }
    }
};

export const captureFrontendError = (error: unknown, context?: Record<string, unknown>) => {
    if (dsn && sentryModule) {
        sentryModule.captureException(error, { extra: context });
    }
    errorTelemetry.capture(error, context);
};

export const captureFrontendMessage = (message: string, context?: Record<string, unknown>) => {
    if (dsn && sentryModule) {
        sentryModule.captureMessage(message, { level: "warning", extra: context });
    }
    errorTelemetry.captureMessage(message, context);
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

import * as Sentry from "@sentry/react";

export const initMonitoring = () => {
    Sentry.init({
        dsn: "https://examplePublicKey@o0.ingest.sentry.io/0", // MOCK DSN
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, 
        // Session Replay
        replaysSessionSampleRate: 0.1, 
        replaysOnErrorSampleRate: 1.0,
    });
};

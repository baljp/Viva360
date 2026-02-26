// ─── lib/frontendLogger.ts ────────────────────────────────────────────────────
// Re-exporta para telemetry.ts para manter compatibilidade com todos os imports
// existentes em services/api/* e src/flow/*.
// Não quebra nada — apenas delega para o sistema de telemetria centralizado.
// ─────────────────────────────────────────────────────────────────────────────
import { errorTelemetry } from './telemetry';

export const captureFrontendError = (
  error: unknown,
  context?: Record<string, unknown>,
) => errorTelemetry.capture(error, context);

export const captureFrontendMessage = (
  message: string,
  context?: Record<string, unknown>,
) => errorTelemetry.captureMessage(message, context);

export const errorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'unknown';
};

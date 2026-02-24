import type { NotificationPrefKey } from './settingsConfig';

export type FlowBridge = { go: (target: string) => void };
export type PrivacyState = { tribe: boolean; patterns: boolean; history: boolean };
export type SettingsNotifState = Record<NotificationPrefKey, boolean>;
type UiError = { message?: string } | null | undefined;

export const errorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as UiError)?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};


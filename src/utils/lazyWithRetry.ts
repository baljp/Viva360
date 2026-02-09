import React from 'react';

const RETRY_PREFIX = 'viva360.lazy.retry.';

/**
 * Lazy import with one-time hard reload fallback for stale chunk manifests.
 * This prevents infinite spinner states after deploys when a client still has
 * old chunk references cached.
 */
export const lazyWithRetry = <T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  key: string
) => {
  return React.lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`${RETRY_PREFIX}${key}`);
      }
      return module;
    } catch (error) {
      if (typeof window !== 'undefined') {
        const retryKey = `${RETRY_PREFIX}${key}`;
        const hasRetried = sessionStorage.getItem(retryKey) === '1';
        if (!hasRetried) {
          sessionStorage.setItem(retryKey, '1');
          window.location.reload();
          return new Promise<never>(() => {});
        }
        sessionStorage.removeItem(retryKey);
      }
      throw error;
    }
  });
};


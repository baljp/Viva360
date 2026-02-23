export const captureFrontendError = (error: unknown, context?: Record<string, unknown>) => {
  if (context) {
    console.error('[FrontendError]', error, context);
    return;
  }
  console.error('[FrontendError]', error);
};

export const captureFrontendMessage = (message: string, context?: Record<string, unknown>) => {
  console.warn('[FrontendMessage]', message, context || {});
};

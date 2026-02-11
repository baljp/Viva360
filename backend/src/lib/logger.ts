export const logger = {
  info: (message: string, meta?: any) => {
    try {
        console.log(JSON.stringify({ level: 'info', message, timestamp: new Date(), ...meta }));
    } catch {
        console.log(`[INFO] ${message}`, meta);
    }
  },
  error: (message: string, error?: any) => {
    try {
        // Safe error serialization
        const errorObj = {
            level: 'error', 
            message, 
            timestamp: new Date(), 
            stack: error?.stack,
        };

        // Attempt to capture error properties safely, avoiding circular refs
        if (error && typeof error === 'object') {
            try {
                // Shallow copy first level properties only to avoid deep circular issues
                for (const key in error) {
                    if (key !== 'stack' && typeof error[key] !== 'function' && typeof error[key] !== 'object') {
                        (errorObj as any)[key] = error[key];
                    }
                }
            } catch {}
        }

        console.error(JSON.stringify(errorObj));
    } catch (e: any) {
        // Fallback if stringify fails completely
        console.error(`[LOGGER_FAILURE] Could not log error JSON. Original message: ${message}`);
        console.error(error);
    }
  },
  warn: (message: string, meta?: any) => {
    try {
        console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date(), ...meta }));
    } catch {
        console.warn(`[WARN] ${message}`, meta);
    }
  },
  debug: (message: string, meta?: any) => {
    // Enable debug logs even in production temporarily if requested, or keep strict
    // For now, let's allow it if explicitly enabled via ENV or if not production
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEBUG_LOGS === 'true') {
      try {
          console.debug(JSON.stringify({ level: 'debug', message, timestamp: new Date(), ...meta }));
      } catch {
          console.debug(`[DEBUG] ${message}`, meta);
      }
    }
  }
};

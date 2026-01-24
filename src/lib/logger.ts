/**
 * Production-safe logging utility
 * Only logs in development mode to prevent console clutter and performance issues in production
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  
  warn: (...args: unknown[]) => {
    // Only log warnings in development to prevent sensitive data exposure
    if (isDev) console.warn(...args);
  },
  
  error: (...args: unknown[]) => {
    if (isDev) {
      // Full error details in development
      console.error(...args);
    } else {
      // Sanitized error in production - only message, no stack/headers
      const sanitized = args.map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
          // Don't log full objects in production
          return '[object]';
        }
        return arg;
      });
      console.error(...sanitized);
    }
  }
};

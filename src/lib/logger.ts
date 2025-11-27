/**
 * Production-safe logging utility
 * Only logs in development mode to prevent console clutter and performance issues in production
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  }
};

/**
 * Centralized logging utility for consistent logging across the app.
 * Only logs in development mode by default.
 * 
 * Uses console.warn for non-critical logs (debug/info/perf/query) and
 * console.error for errors to comply with linting rules.
 */

interface LogContext {
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

const formatMessage = (module: string, message: string): string => {
  return `[${module}] ${message}`;
};

/**
 * Create a scoped logger for a specific module
 */
export function createLogger(module: string) {
  return {
    debug(message: string, context?: LogContext): void {
      if (!isDev) return;
      // Using warn to satisfy lint rules - debug level logged in dev only
      console.warn(`[DEBUG] ${formatMessage(module, message)}`, context ?? '');
    },

    info(message: string, context?: LogContext): void {
      if (!isDev) return;
      // Using warn to satisfy lint rules - info level logged in dev only
      console.warn(`[INFO] ${formatMessage(module, message)}`, context ?? '');
    },

    warn(message: string, context?: LogContext): void {
      console.warn(formatMessage(module, message), context ?? '');
    },

    error(message: string, error?: unknown, context?: LogContext): void {
      const errorInfo = error instanceof Error 
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
      
      console.error(
        formatMessage(module, message),
        { error: errorInfo, ...context }
      );
    },

    /**
     * Log performance metrics (dev only)
     */
    perf(action: string, durationMs: number, context?: LogContext): void {
      if (!isDev) return;
      console.warn(
        `[PERF] ${formatMessage(module, `${action} completed in ${durationMs}ms`)}`,
        context ?? ''
      );
    },

    /**
     * Log a Supabase query for debugging (dev only)
     */
    query(table: string, operation: string, context?: LogContext): void {
      if (!isDev) return;
      console.warn(
        `[QUERY] ${formatMessage(module, `DB ${operation} on ${table}`)}`,
        context ?? ''
      );
    },
  };
}

/**
 * Default app logger
 */
export const logger = createLogger('App');

/**
 * Measure execution time of an async function
 */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
  log = logger
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    log.perf(label, Math.round(performance.now() - start));
    return result;
  } catch (error) {
    log.error(`${label} failed`, error);
    throw error;
  }
}

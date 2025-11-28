/**
 * Error reporting utility for production monitoring
 * Integrates with error tracking services (Sentry, LogRocket, etc.)
 */

interface ErrorContext {
  component?: string;
  page?: string;
  userId?: string;
  source?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  [key: string]: unknown;
}

/**
 * Report an error to monitoring service
 * In development: logs to console
 * In production: sends to error tracking service (configure VITE_ERROR_TRACKING_DSN)
 */
export function reportError(
  error: Error,
  context?: ErrorContext
) {
  // Always log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorReporter]', error, context);
    return;
  }

  // Production error reporting
  try {
    // Check if Sentry is available (via environment variable)
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    
    if (sentryDsn && typeof window !== 'undefined') {
      // Dynamic import to avoid bundling Sentry if not configured
      // In production, Sentry should be initialized in main.tsx
      // This is a fallback for errors that occur before initialization
      if ('Sentry' in window && typeof (window as { Sentry?: { captureException: (error: Error, options?: unknown) => void } }).Sentry?.captureException === 'function') {
        (window as { Sentry: { captureException: (error: Error, options?: unknown) => void } }).Sentry.captureException(error, {
          contexts: {
            custom: context
          },
          tags: context?.page ? { page: context.page } : undefined,
          user: context?.userId ? { id: context.userId } : undefined,
        });
        return; // Successfully reported to Sentry
      }
    }

    // Fallback: Log to console (always available)
    // In production, consider sending to a logging service
    console.error('[Production Error]', error.message, context);
  } catch (reportingError) {
    // Fail silently if error reporting fails to prevent error loops
    console.error('[ErrorReporter] Failed to report error:', reportingError);
  }
}

/**
 * Report a warning that doesn't require immediate attention
 */
export function reportWarning(
  message: string,
  context?: ErrorContext
) {
  if (import.meta.env.DEV) {
    console.warn('[Warning]', message, context);
  }
  
  // In production, warnings are typically not sent to error tracking
  // but could be logged to a separate channel if needed
  // For now, only log in development to avoid noise
}

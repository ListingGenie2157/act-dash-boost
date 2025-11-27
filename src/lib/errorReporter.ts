/**
 * Error reporting utility for production monitoring
 * Integrates with error tracking services (Sentry, LogRocket, etc.)
 */

interface ErrorContext {
  component?: string;
  page?: string;
  userId?: string;
  [key: string]: any;
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
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    // Example for Sentry:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       custom: context
    //     }
    //   });
    // }

    // For now, send to console.error (always available)
    console.error('[Production Error]', error.message, context);
  } catch (reportingError) {
    // Fail silently if error reporting fails
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
  
  // In production, you might want to send warnings to a separate channel
  // or filter them based on severity
}

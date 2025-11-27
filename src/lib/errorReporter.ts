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
 * In production: sends to Sentry (if configured)
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

  // Production error reporting with Sentry
  try {
    // Check if Sentry is available (loaded via main.tsx)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.captureException(error, {
        contexts: {
          custom: context
        },
        tags: {
          component: context?.component,
          page: context?.page,
        },
        user: context?.userId ? { id: context.userId } : undefined,
      });
    } else {
      // Fallback to console if Sentry not configured
      console.error('[Production Error]', error.message, context);
    }
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
    return;
  }
  
  // Send warnings to Sentry in production with lower severity
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    const Sentry = (window as any).Sentry;
    Sentry.captureMessage(message, {
      level: 'warning',
      contexts: {
        custom: context
      },
    });
  }
}

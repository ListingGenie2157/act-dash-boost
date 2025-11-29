import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { reportError } from './lib/errorReporter'

// Global error handlers for unhandled promise rejections and errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  reportError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    { source: 'unhandledrejection' }
  );
  // Prevent default browser behavior
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  reportError(
    event.error || new Error(event.message),
    { 
      source: 'global-error', 
      filename: event.filename, 
      lineno: event.lineno,
      colno: event.colno
    }
  );
});

// Initialize Sentry for production error tracking (if DSN is configured)
// Note: Install @sentry/react package to enable Sentry error tracking
// npm install @sentry/react
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  // Dynamically import Sentry to avoid bundling if not configured
  // This will only work if @sentry/react is installed
  const initSentry = async () => {
    try {
      // @ts-expect-error - @sentry/react may not be installed, that's ok
      const Sentry = await import('@sentry/react');
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
      
      // Make Sentry available globally for errorReporter
      (window as { Sentry?: typeof Sentry }).Sentry = Sentry;
    } catch (error) {
      // Sentry not installed or failed to load - continue without it
      console.warn('Sentry not available - error tracking will use console fallback. Install @sentry/react to enable.');
    }
  };
  void initSentry();
}

createRoot(document.getElementById("root")!).render(<App />);

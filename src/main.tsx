import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
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

// Initialize Sentry for production error tracking
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
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
}

createRoot(document.getElementById("root")!).render(<App />);

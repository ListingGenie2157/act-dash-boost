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

createRoot(document.getElementById("root")!).render(<App />);

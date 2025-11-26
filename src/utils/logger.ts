const APP_PREFIX = '[actdash]';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogPayload = Record<string, unknown> | undefined;

const isDev = import.meta.env.DEV;

const logWithLevel = (level: LogLevel, message: string, payload?: LogPayload) => {
  if (level === 'debug' && !isDev) {
    return;
  }

  const prefix = `${APP_PREFIX} ${message}`;
  if (payload) {
    // eslint-disable-next-line no-console
    console[level](prefix, payload);
  } else {
    // eslint-disable-next-line no-console
    console[level](prefix);
  }
};

export const logger = {
  debug: (message: string, payload?: LogPayload) => logWithLevel('debug', message, payload),
  info: (message: string, payload?: LogPayload) => logWithLevel('info', message, payload),
  warn: (message: string, payload?: LogPayload) => logWithLevel('warn', message, payload),
  error: (message: string, payload?: LogPayload) => logWithLevel('error', message, payload),
};

/**
 * Logger Utility
 *
 * Production-safe logging utility that only outputs in development mode.
 * Replaces direct console.log calls to prevent console spam in production.
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

const createLogger = (): Logger => {
  const noop = () => {};

  const logWithLevel = (level: LogLevel) => {
    if (!isDev) return noop;
    return (...args: unknown[]) => {
      console[level](...args);
    };
  };

  return {
    log: logWithLevel('log'),
    warn: logWithLevel('warn'),
    error: (...args: unknown[]) => {
      // Always log errors, even in production
      console.error(...args);
    },
    info: logWithLevel('info'),
    debug: logWithLevel('debug'),
    group: isDev ? (label: string) => console.group(label) : noop,
    groupEnd: isDev ? () => console.groupEnd() : noop,
    time: isDev ? (label: string) => console.time(label) : noop,
    timeEnd: isDev ? (label: string) => console.timeEnd(label) : noop,
  };
};

export const logger = createLogger();

export default logger;

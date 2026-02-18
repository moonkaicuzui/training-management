/**
 * Lightweight Error Reporting Service
 *
 * A zero-dependency error monitoring layer that:
 * - In development: logs structured errors to the console
 * - In production: sends errors to a configurable endpoint (Sentry DSN, custom API, etc.)
 * - Queues reports when offline and flushes them when connectivity is restored
 *
 * Public API mirrors Sentry's interface so swapping to @sentry/react later is trivial:
 *   captureException, captureMessage, setUser, init
 */

import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorReportUser {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface ErrorReport {
  /** Unique report identifier */
  id: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Severity / log level */
  level: ErrorSeverity;
  /** Human-readable message */
  message: string;
  /** Error stack trace (when available) */
  stack?: string;
  /** React component stack (when available) */
  componentStack?: string;
  /** URL where the error occurred */
  url: string;
  /** Browser user-agent string */
  userAgent: string;
  /** Currently-set user context */
  user?: ErrorReportUser;
  /** Arbitrary extra data */
  extra?: Record<string, unknown>;
  /** Tags for grouping/filtering */
  tags?: Record<string, string>;
}

export interface ErrorReportingConfig {
  /**
   * Remote endpoint to POST error reports to.
   * Can be a Sentry DSN, a custom REST API URL, etc.
   * When empty, reports are only logged to the console.
   */
  dsn: string;
  /** Application environment label (e.g. "production", "staging") */
  environment: string;
  /** Application release/version tag */
  release?: string;
  /** Maximum reports held in the offline queue */
  maxQueueSize: number;
  /** Whether reporting is enabled at all */
  enabled: boolean;
  /** Sample rate 0.0 - 1.0 (1.0 = report everything) */
  sampleRate: number;
  /** Minimum severity level to report */
  minLevel: ErrorSeverity;
  /** Hook called before a report is sent; return `null` to drop the report */
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
}

// ---------------------------------------------------------------------------
// Defaults & internal state
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: ErrorReportingConfig = {
  dsn: '',
  environment: import.meta.env.MODE ?? 'development',
  release: undefined,
  maxQueueSize: 50,
  enabled: true,
  sampleRate: 1.0,
  minLevel: 'warning',
  beforeSend: undefined,
};

const SEVERITY_ORDER: Record<ErrorSeverity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  fatal: 4,
};

let config: ErrorReportingConfig = { ...DEFAULT_CONFIG };
let currentUser: ErrorReportUser | undefined;
let offlineQueue: ErrorReport[] = [];
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isInitialized = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function shouldSample(): boolean {
  return Math.random() < config.sampleRate;
}

function meetsMinLevel(level: ErrorSeverity): boolean {
  return SEVERITY_ORDER[level] >= SEVERITY_ORDER[config.minLevel];
}

function buildReport(
  level: ErrorSeverity,
  message: string,
  options?: {
    error?: Error;
    componentStack?: string;
    extra?: Record<string, unknown>;
    tags?: Record<string, string>;
  },
): ErrorReport {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    stack: options?.error?.stack,
    componentStack: options?.componentStack,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    user: currentUser,
    extra: {
      ...options?.extra,
      environment: config.environment,
      release: config.release,
    },
    tags: options?.tags,
  };
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function sendReport(report: ErrorReport): Promise<boolean> {
  // Always log to console in development
  if (import.meta.env.DEV) {
    logReportToConsole(report);
  }

  // If no DSN configured or not in production, skip network transport
  if (!config.dsn) {
    return true;
  }

  try {
    const response = await fetch(config.dsn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      // Keep-alive so the request survives page unload
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}

function logReportToConsole(report: ErrorReport): void {
  const prefix = `[ErrorReporting][${report.level.toUpperCase()}]`;

  switch (report.level) {
    case 'fatal':
    case 'error':
      logger.error(prefix, report.message, {
        id: report.id,
        stack: report.stack,
        componentStack: report.componentStack,
        url: report.url,
        user: report.user,
        extra: report.extra,
        tags: report.tags,
      });
      break;
    case 'warning':
      logger.warn(prefix, report.message, {
        id: report.id,
        extra: report.extra,
      });
      break;
    default:
      logger.info(prefix, report.message, {
        id: report.id,
        extra: report.extra,
      });
  }
}

// ---------------------------------------------------------------------------
// Offline queue management
// ---------------------------------------------------------------------------

function enqueue(report: ErrorReport): void {
  if (offlineQueue.length >= config.maxQueueSize) {
    // Drop oldest report to make room
    offlineQueue.shift();
  }
  offlineQueue.push(report);

  // Persist queue to sessionStorage so reports survive soft navigations
  try {
    sessionStorage.setItem('error_report_queue', JSON.stringify(offlineQueue));
  } catch {
    // Storage full or unavailable - that's fine, we still have the in-memory queue
  }
}

function restoreQueue(): void {
  try {
    const stored = sessionStorage.getItem('error_report_queue');
    if (stored) {
      offlineQueue = JSON.parse(stored) as ErrorReport[];
    }
  } catch {
    offlineQueue = [];
  }
}

async function flushQueue(): Promise<void> {
  if (offlineQueue.length === 0) return;

  const pending = [...offlineQueue];
  offlineQueue = [];

  for (const report of pending) {
    const ok = await sendReport(report);
    if (!ok) {
      // Re-enqueue failed reports
      enqueue(report);
      break; // Stop trying if we hit a failure - likely still offline
    }
  }

  // Clean up sessionStorage
  try {
    if (offlineQueue.length === 0) {
      sessionStorage.removeItem('error_report_queue');
    } else {
      sessionStorage.setItem('error_report_queue', JSON.stringify(offlineQueue));
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Connectivity listeners
// ---------------------------------------------------------------------------

function setupConnectivityListeners(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    isOnline = true;
    void flushQueue();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the error reporting service.
 * Call once at application startup (e.g. in main.tsx).
 */
export function init(userConfig?: Partial<ErrorReportingConfig>): void {
  config = { ...DEFAULT_CONFIG, ...userConfig };
  isInitialized = true;
  restoreQueue();
  setupConnectivityListeners();

  logger.log('[ErrorReporting] Initialized', {
    environment: config.environment,
    dsn: config.dsn ? '(configured)' : '(console-only)',
    sampleRate: config.sampleRate,
  });
}

/**
 * Capture an Error object and report it.
 * This is the primary method for reporting caught exceptions.
 */
export function captureException(
  error: Error,
  options?: {
    level?: ErrorSeverity;
    componentStack?: string;
    extra?: Record<string, unknown>;
    tags?: Record<string, string>;
  },
): string | null {
  if (!config.enabled) return null;

  const level = options?.level ?? 'error';
  if (!meetsMinLevel(level)) return null;
  if (!shouldSample()) return null;

  const report = buildReport(level, error.message, {
    error,
    componentStack: options?.componentStack,
    extra: options?.extra,
    tags: options?.tags,
  });

  // Allow user-defined filtering
  const finalReport = config.beforeSend ? config.beforeSend(report) : report;
  if (!finalReport) return null;

  if (isOnline && config.dsn) {
    void sendReport(finalReport).then((ok) => {
      if (!ok) enqueue(finalReport);
    });
  } else if (config.dsn) {
    enqueue(finalReport);
  } else {
    // No DSN - just log
    logReportToConsole(finalReport);
  }

  return finalReport.id;
}

/**
 * Capture a plain message and report it.
 * Useful for breadcrumbs, informational events, or custom warnings.
 */
export function captureMessage(
  message: string,
  options?: {
    level?: ErrorSeverity;
    extra?: Record<string, unknown>;
    tags?: Record<string, string>;
  },
): string | null {
  if (!config.enabled) return null;

  const level = options?.level ?? 'info';
  if (!meetsMinLevel(level)) return null;
  if (!shouldSample()) return null;

  const report = buildReport(level, message, {
    extra: options?.extra,
    tags: options?.tags,
  });

  const finalReport = config.beforeSend ? config.beforeSend(report) : report;
  if (!finalReport) return null;

  if (isOnline && config.dsn) {
    void sendReport(finalReport).then((ok) => {
      if (!ok) enqueue(finalReport);
    });
  } else if (config.dsn) {
    enqueue(finalReport);
  } else {
    logReportToConsole(finalReport);
  }

  return finalReport.id;
}

/**
 * Set the user context that is attached to all subsequent reports.
 * Pass `null` to clear the user.
 */
export function setUser(user: ErrorReportUser | null): void {
  currentUser = user ?? undefined;
}

/**
 * Add global tags that will be merged into every subsequent report.
 * Existing tags with the same key will be overwritten.
 */
export function setTags(tags: Record<string, string>): void {
  const originalBeforeSend = config.beforeSend;
  config.beforeSend = (report) => {
    report.tags = { ...tags, ...report.tags };
    return originalBeforeSend ? originalBeforeSend(report) : report;
  };
}

/**
 * Manually flush the offline queue.
 * Useful to call before page unload or on route changes.
 */
export { flushQueue };

/**
 * Get the current number of queued (unsent) reports.
 * Useful for debugging / monitoring.
 */
export function getQueueSize(): number {
  return offlineQueue.length;
}

/**
 * Check whether the service has been initialized.
 */
export function isReady(): boolean {
  return isInitialized;
}

// ---------------------------------------------------------------------------
// Convenience: default export as a namespace-like object
// ---------------------------------------------------------------------------

const errorReporting = {
  init,
  captureException,
  captureMessage,
  setUser,
  setTags,
  flushQueue,
  getQueueSize,
  isReady,
} as const;

export default errorReporting;

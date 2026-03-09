/**
 * 전역 비동기 에러 핸들러
 * 앱 초기화 시 호출하여 Promise rejection 등을 캐치하고
 * 사용자에게 toast 알림을 표시하며 에러 리포팅 서비스로 전송합니다.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import errorReporting from '@/utils/sentry';
import { useUIStore } from '@/stores/uiStore';

/** Throttle interval (ms) to prevent toast spam from rapid successive errors */
const TOAST_THROTTLE_MS = 3000;

export function useGlobalErrorHandler() {
  const { t } = useTranslation();
  const addToast = useUIStore((state) => state.addToast);
  const lastToastTimestamp = useRef<number>(0);

  useEffect(() => {
    /**
     * Show an error toast to the user, throttled to avoid flooding the UI
     * when multiple errors fire in quick succession.
     */
    const showErrorToast = (title: string, message?: string) => {
      const now = Date.now();
      if (now - lastToastTimestamp.current < TOAST_THROTTLE_MS) return;
      lastToastTimestamp.current = now;

      addToast({
        type: 'error',
        title,
        message,
        duration: 8000,
      });
    };

    /**
     * Extract a user-friendly message from an unknown rejection reason.
     */
    const extractMessage = (reason: unknown): string => {
      if (reason instanceof Error) return reason.message;
      if (typeof reason === 'string') return reason;
      return t('error.unknownError');
    };

    // 처리되지 않은 Promise rejection 핸들링
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logger.error('[Unhandled Promise Rejection]', reason);

      // 에러 리포팅 서비스로 전송
      if (reason instanceof Error) {
        errorReporting.captureException(reason, {
          level: 'error',
          tags: { source: 'unhandledrejection' },
        });
      } else {
        errorReporting.captureMessage(
          `Unhandled Promise Rejection: ${extractMessage(reason)}`,
          {
            level: 'error',
            extra: { reason: String(reason) },
            tags: { source: 'unhandledrejection' },
          },
        );
      }

      // 사용자에게 toast 알림 표시
      showErrorToast(
        t('error.unhandledError'),
        extractMessage(reason),
      );
    };

    // 전역 에러 핸들링
    const handleError = (event: ErrorEvent) => {
      logger.error('[Global Error]', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      // 에러 리포팅 서비스로 전송
      const error = event.error instanceof Error
        ? event.error
        : new Error(event.message);

      errorReporting.captureException(error, {
        level: 'error',
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        tags: { source: 'window.onerror' },
      });

      // 사용자에게 toast 알림 표시
      showErrorToast(
        t('error.unhandledError'),
        event.message,
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [t, addToast]);
}

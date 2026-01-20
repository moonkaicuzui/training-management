/**
 * 전역 비동기 에러 핸들러
 * 앱 초기화 시 호출하여 Promise rejection 등을 캐치
 */

import { useEffect } from 'react';
import { logger } from '@/utils/logger';

export function useGlobalErrorHandler() {
  useEffect(() => {
    // 처리되지 않은 Promise rejection 핸들링
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('[Unhandled Promise Rejection]', event.reason);

      // 사용자에게 알림 (선택적)
      // 여기서 toast 알림 등을 표시할 수 있음
    };

    // 전역 에러 핸들링
    const handleError = (event: ErrorEvent) => {
      logger.error('[Global Error]', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}

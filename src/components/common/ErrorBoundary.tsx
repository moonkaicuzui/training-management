import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';
import errorReporting from '@/utils/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 에러 발생 시 복구 시도 횟수 제한 */
  maxRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * ErrorBoundary Component
 * React 컴포넌트 트리에서 발생하는 JavaScript 오류를 캐치하고
 * 전체 앱 크래시 대신 대체 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('[ErrorBoundary] Caught an error:', error.message);
    logger.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // 프로덕션에서 에러 리포팅 서비스로 전송 (예: Sentry)
    this.reportError(error, errorInfo);
  }

  /**
   * 에러 리포팅 서비스로 에러 전송
   * errorReporting 서비스를 통해 개발/프로덕션 환경 모두에서 에러를 캡처합니다.
   */
  private reportError(error: Error, errorInfo: ErrorInfo): void {
    errorReporting.captureException(error, {
      level: 'error',
      componentStack: errorInfo.componentStack ?? undefined,
      extra: {
        retryCount: this.state.retryCount,
        maxRetries: this.props.maxRetries ?? 3,
      },
      tags: {
        boundary: 'ErrorBoundary',
        source: 'componentDidCatch',
      },
    });
  }

  handleReset = (): void => {
    const maxRetries = this.props.maxRetries ?? 3;

    if (this.state.retryCount < maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // 최대 재시도 횟수 초과 시 페이지 새로고침
      logger.warn('[ErrorBoundary] Max retries exceeded, reloading page');
      window.location.reload();
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries ?? 3}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 에러 발생 시 표시되는 UI 컴포넌트
 * i18n 지원을 위해 함수형 컴포넌트로 분리
 */
interface ErrorFallbackUIProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

function ErrorFallbackUI({
  error,
  errorInfo,
  retryCount,
  maxRetries,
  onReset,
  onReload,
  onGoHome,
}: ErrorFallbackUIProps) {
  const { t } = useTranslation();
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{t('error.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('error.description')}
          </p>

          {retryCount > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
              {t('error.retryCount', {
                count: retryCount,
                max: maxRetries,
              })}
            </p>
          )}

          {import.meta.env.DEV && error && (
            <details className="text-left mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                {t('error.details')}
              </summary>
              <div className="mt-2 space-y-2">
                <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-24">
                  <strong>Error:</strong> {error.message}
                </pre>
                {error.stack && (
                  <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                    <strong>Stack:</strong>
                    {'\n'}
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                    <strong>Component Stack:</strong>
                    {'\n'}
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-center flex-wrap">
          {canRetry && (
            <Button variant="outline" onClick={onReset}>
              {t('error.retry')}
            </Button>
          )}
          <Button variant="outline" onClick={onGoHome}>
            <Home className="h-4 w-4 mr-2" />
            {t('error.goHome')}
          </Button>
          <Button onClick={onReload}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('error.reload')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * 페이지 레벨 ErrorBoundary
 * 개별 페이지 컴포넌트를 감싸는 데 사용
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      maxRetries={3}
      onError={(error, errorInfo) => {
        logger.error('[Page Error]', error.message);
        logger.error('[Page Error] Component Stack:', errorInfo.componentStack);
        errorReporting.captureException(error, {
          level: 'error',
          componentStack: errorInfo.componentStack ?? undefined,
          tags: { boundary: 'PageErrorBoundary' },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * 섹션 레벨 ErrorBoundary
 * 대시보드 카드, 차트 등 개별 섹션을 감싸는 데 사용
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
}

export function SectionErrorBoundary({ children, sectionName }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      maxRetries={2}
      fallback={<SectionErrorFallback sectionName={sectionName} />}
      onError={(error) => {
        logger.warn(`[Section Error: ${sectionName || 'Unknown'}]`, error.message);
        errorReporting.captureException(error, {
          level: 'warning',
          tags: {
            boundary: 'SectionErrorBoundary',
            section: sectionName || 'Unknown',
          },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function SectionErrorFallback({ sectionName }: { sectionName?: string }) {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive/60 mb-2" />
        <p className="text-sm text-muted-foreground">
          {sectionName
            ? t('error.sectionError', {
                section: sectionName,
              })
            : t('error.sectionLoadError')}
        </p>
      </CardContent>
    </Card>
  );
}

// Note: useGlobalErrorHandler has been moved to '@/hooks/useGlobalErrorHandler'

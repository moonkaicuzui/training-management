import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * React 컴포넌트 트리에서 발생하는 JavaScript 오류를 캐치하고
 * 전체 앱 크래시 대신 대체 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md border-destructive/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">오류가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    오류 세부 정보
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                다시 시도
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCw className="h-4 w-4 mr-2" />
                페이지 새로고침
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 페이지 레벨 ErrorBoundary
 * 개별 페이지 컴포넌트를 감싸는 데 사용
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 프로덕션에서는 에러 리포팅 서비스로 전송 가능
        console.error('Page Error:', error, errorInfo.componentStack);
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
      fallback={
        <Card className="border-dashed border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive/60 mb-2" />
            <p className="text-sm text-muted-foreground">
              {sectionName ? `${sectionName} 로딩 중 오류가 발생했습니다` : '이 섹션을 로드할 수 없습니다'}
            </p>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

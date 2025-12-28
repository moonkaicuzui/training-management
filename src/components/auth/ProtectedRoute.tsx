/**
 * Protected Route Component
 * 인증 및 권한 기반 라우트 보호
 */

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { RolePermissions } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof RolePermissions;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, hasPermission, isLoading } = useAuthStore();

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // 비인증 상태
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // 권한 확인
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-semibold">접근 권한이 없습니다</h2>
        <p className="text-muted-foreground">
          이 페이지에 접근하려면 권한이 필요합니다.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// 개발 모드에서 인증 우회 (VITE_DEV_AUTH_BYPASS=true)
const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

export function DevProtectedRoute({
  children,
  requiredPermission,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  // 개발 모드에서 인증 우회
  if (DEV_AUTH_BYPASS && import.meta.env.DEV) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute
      requiredPermission={requiredPermission}
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
}

import { cn } from '@/lib/utils';
import {
  SkeletonDashboard,
  SkeletonTable,
  SkeletonCard,
  SkeletonForm,
} from '@/components/ui/skeleton';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

/**
 * 대시보드 페이지용 스켈레톤 로더
 */
export function DashboardLoading() {
  return <SkeletonDashboard />;
}

/**
 * 테이블 페이지용 스켈레톤 로더
 */
export function TableLoading({
  rows = 10,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      {/* Table */}
      <SkeletonTable rows={rows} columns={columns} />
    </div>
  );
}

/**
 * 상세 페이지용 스켈레톤 로더
 */
export function DetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/**
 * 폼 페이지용 스켈레톤 로더
 */
export function FormLoading({ fields = 6 }: { fields?: number }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        {/* Form */}
        <SkeletonForm fields={fields} />
      </div>
    </div>
  );
}

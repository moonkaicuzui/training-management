import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 스켈레톤의 높이
   */
  height?: string | number;
  /**
   * 스켈레톤의 너비
   */
  width?: string | number;
  /**
   * 원형 스켈레톤 여부
   */
  circle?: boolean;
}

/**
 * 기본 스켈레톤 컴포넌트
 * 로딩 상태를 시각적으로 표현하는 애니메이션 플레이스홀더
 */
export function Skeleton({
  className,
  height,
  width,
  circle,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted rounded-md',
        circle && 'rounded-full',
        className
      )}
      style={{
        height: height,
        width: width,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * 텍스트 스켈레톤 - 텍스트 라인을 위한 스켈레톤
 */
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * 카드 스켈레톤 - 일반적인 카드 레이아웃
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <Skeleton height="1.5rem" width="60%" />
      <SkeletonText lines={3} />
    </div>
  );
}

/**
 * 통계 카드 스켈레톤 - 대시보드 통계 카드용
 */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton height="0.875rem" width="40%" />
        <Skeleton height="2rem" width="2rem" circle />
      </div>
      <Skeleton height="2rem" width="50%" />
    </div>
  );
}

/**
 * 테이블 스켈레톤 - 테이블 데이터 로딩용
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border', className)}>
      {/* Header */}
      <div className="border-b p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="1rem" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            'p-4 flex gap-4',
            rowIndex !== rows - 1 && 'border-b'
          )}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 차트 스켈레톤 - 차트 로딩용
 */
export function SkeletonChart({
  height = 300,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="space-y-2 mb-4">
        <Skeleton height="1.25rem" width="40%" />
        <Skeleton height="0.875rem" width="60%" />
      </div>
      <Skeleton height={height} />
    </div>
  );
}

/**
 * 대시보드 스켈레톤 - 전체 대시보드 레이아웃
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height="2rem" width="30%" />
        <Skeleton height="1rem" width="50%" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Table */}
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}

/**
 * 폼 스켈레톤 - 폼 로딩용
 */
export function SkeletonForm({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height="0.875rem" width="20%" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
      <Skeleton height="2.5rem" width="30%" />
    </div>
  );
}

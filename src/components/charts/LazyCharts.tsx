/**
 * Lazy-loaded Chart Components
 * Recharts 라이브러리를 동적으로 로드하여 초기 번들 크기 감소
 */

import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// Chart loading skeleton
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-muted/30 rounded-lg animate-pulse"
      style={{ height }}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Pre-built lazy BarChart component
interface LazyBarChartProps {
  data: unknown[];
  height?: number;
  children?: ReactNode;
  xAxisKey?: string;
  xAxisFormatter?: (value: string) => string;
}

export function LazyBarChart({
  data,
  height = 300,
  children,
  xAxisKey = 'name',
  xAxisFormatter,
}: LazyBarChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <BarChartRenderer
        data={data}
        height={height}
        xAxisKey={xAxisKey}
        xAxisFormatter={xAxisFormatter}
      >
        {children}
      </BarChartRenderer>
    </Suspense>
  );
}

const BarChartRenderer = lazy(async () => {
  const {
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } = await import('recharts');

  return {
    default: function BarChartComponent({
      data,
      height,
      children,
      xAxisKey,
      xAxisFormatter,
    }: LazyBarChartProps & { children?: ReactNode }) {
      return (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xAxisKey}
                tickFormatter={xAxisFormatter}
                className="text-sm"
              />
              <YAxis className="text-sm" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              {children}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    },
  };
});

// Pre-built lazy PieChart component
interface LazyPieChartProps {
  data: { grade: string; count: number }[];
  height?: number;
  colors?: Record<string, string>;
}

export function LazyPieChart({
  data,
  height = 300,
  colors = {},
}: LazyPieChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <PieChartRenderer data={data} height={height} colors={colors} />
    </Suspense>
  );
}

const PieChartRenderer = lazy(async () => {
  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = await import('recharts');

  return {
    default: function PieChartComponent({
      data,
      height,
      colors = {},
    }: LazyPieChartProps) {
      return (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ payload, percent }) =>
                  percent && percent > 0
                    ? `${payload?.grade} (${Math.round(percent * 100)}%)`
                    : ''
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="grade"
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.grade}
                    fill={colors[entry.grade] || '#8884d8'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    },
  };
});

// Export Bar component for use with LazyBarChart
export { Bar } from 'recharts';

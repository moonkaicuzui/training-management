/**
 * Lazy-loaded Chart Components
 * Recharts 라이브러리를 동적으로 로드하여 초기 번들 크기 감소
 *
 * Props 기반 API로 정적 recharts import 제거 - 번들 최적화
 */

import { lazy, Suspense, memo } from 'react';
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

// Bar configuration type
export interface BarConfig {
  dataKey: string;
  name?: string;
  fill?: string;
  radius?: [number, number, number, number];
  stackId?: string;
}

// Line configuration type
export interface LineConfig {
  dataKey: string;
  name?: string;
  stroke?: string;
  strokeWidth?: number;
  type?: 'linear' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
  dot?: boolean;
}

// Pre-built lazy BarChart component
interface LazyBarChartProps {
  data: unknown[];
  height?: number;
  bars: BarConfig[];
  xAxisKey?: string;
  xAxisFormatter?: (value: string) => string;
}

export const LazyBarChart = memo(function LazyBarChart({
  data,
  height = 300,
  bars,
  xAxisKey = 'name',
  xAxisFormatter,
}: LazyBarChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <BarChartRenderer
        data={data}
        height={height}
        bars={bars}
        xAxisKey={xAxisKey}
        xAxisFormatter={xAxisFormatter}
      />
    </Suspense>
  );
});

const BarChartRenderer = lazy(async () => {
  const {
    BarChart,
    Bar,
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
      bars,
      xAxisKey,
      xAxisFormatter,
    }: LazyBarChartProps) {
      return (
        <div style={{ height, minWidth: 100, width: '100%', display: 'flex', flexDirection: 'column', minHeight: typeof height === 'number' ? height : 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={100}>
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
              {bars.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.fill || '#8884d8'}
                  radius={bar.radius}
                  stackId={bar.stackId}
                />
              ))}
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

export const LazyPieChart = memo(function LazyPieChart({
  data,
  height = 300,
  colors = {},
}: LazyPieChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <PieChartRenderer data={data} height={height} colors={colors} />
    </Suspense>
  );
});

const PieChartRenderer = lazy(async () => {
  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = await import('recharts');

  return {
    default: function PieChartComponent({
      data,
      height,
      colors = {},
    }: LazyPieChartProps) {
      return (
        <div style={{ height, minWidth: 100, width: '100%', display: 'flex', flexDirection: 'column', minHeight: typeof height === 'number' ? height : 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={100}>
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

// Pre-built lazy AreaChart component
interface LazyAreaChartProps {
  data: unknown[];
  height?: number;
  areas: Array<{
    dataKey: string;
    name?: string;
    stroke?: string;
    fill?: string;
    type?: 'linear' | 'monotone';
  }>;
  xAxisKey?: string;
  xAxisFormatter?: (value: string) => string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export const LazyAreaChart = memo(function LazyAreaChart({
  data,
  height = 300,
  areas,
  xAxisKey = 'name',
  xAxisFormatter,
  showGrid = true,
  showLegend = true,
}: LazyAreaChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <AreaChartRenderer
        data={data}
        height={height}
        areas={areas}
        xAxisKey={xAxisKey}
        xAxisFormatter={xAxisFormatter}
        showGrid={showGrid}
        showLegend={showLegend}
      />
    </Suspense>
  );
});

const AreaChartRenderer = lazy(async () => {
  const {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } = await import('recharts');

  return {
    default: function AreaChartComponent({
      data,
      height,
      areas,
      xAxisKey,
      xAxisFormatter,
      showGrid,
      showLegend,
    }: LazyAreaChartProps) {
      return (
        <div style={{ height, minWidth: 100, width: '100%', display: 'flex', flexDirection: 'column', minHeight: typeof height === 'number' ? height : 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={100}>
            <AreaChart data={data} style={{ cursor: 'pointer' }}>
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              )}
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
              {showLegend && <Legend />}
              {areas.map((area) => (
                <Area
                  key={area.dataKey}
                  type={area.type || 'monotone'}
                  dataKey={area.dataKey}
                  name={area.name}
                  stroke={area.stroke || '#8884d8'}
                  fill={area.fill || '#8884d8'}
                  fillOpacity={0.1}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    },
  };
});

// Pre-built lazy LineChart component
interface LazyLineChartProps {
  data: unknown[];
  height?: number;
  lines: LineConfig[];
  xAxisKey?: string;
  xAxisFormatter?: (value: string) => string;
}

export const LazyLineChart = memo(function LazyLineChart({
  data,
  height = 300,
  lines,
  xAxisKey = 'name',
  xAxisFormatter,
}: LazyLineChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <LineChartRenderer
        data={data}
        height={height}
        lines={lines}
        xAxisKey={xAxisKey}
        xAxisFormatter={xAxisFormatter}
      />
    </Suspense>
  );
});

const LineChartRenderer = lazy(async () => {
  const {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } = await import('recharts');

  return {
    default: function LineChartComponent({
      data,
      height,
      lines,
      xAxisKey,
      xAxisFormatter,
    }: LazyLineChartProps) {
      return (
        <div style={{ height, minWidth: 100, width: '100%', display: 'flex', flexDirection: 'column', minHeight: typeof height === 'number' ? height : 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={100}>
            <LineChart data={data} style={{ cursor: 'pointer' }}>
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
              {lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type={line.type || 'monotone'}
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.stroke || '#8884d8'}
                  strokeWidth={line.strokeWidth || 2}
                  dot={line.dot !== false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    },
  };
});

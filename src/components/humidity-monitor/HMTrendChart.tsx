/**
 * 온도-습도 모니터링 — 정상률 추이 차트
 * LazyLineChart 사용 (Recharts 동적 import)
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyLineChart } from '@/components/charts/LazyCharts';
import type { HMTrendItem } from '@/types/humidityMonitor';

interface HMTrendChartProps {
  data: HMTrendItem[];
}

export default function HMTrendChart({ data }: HMTrendChartProps) {
  const { t } = useTranslation();

  // 목표선(100%) 데이터 추가
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        target: 100,
      })),
    [data],
  );

  const lines = useMemo(
    () => [
      {
        dataKey: 'okRate',
        name: t('humidityMonitor.chart.okRate'),
        stroke: '#22c55e',
        strokeWidth: 2,
        type: 'monotone' as const,
        dot: true,
      },
      {
        dataKey: 'target',
        name: t('humidityMonitor.chart.target'),
        stroke: '#ef4444',
        strokeWidth: 1,
        type: 'linear' as const,
        dot: false,
      },
    ],
    [t],
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium sm:text-base">
          {t('humidityMonitor.chart.trendTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LazyLineChart
          data={chartData}
          height={300}
          lines={lines}
          xAxisKey="inspectionDate"
          xAxisFormatter={(value: string) => {
            // YYYY-MM-DD → MM/DD
            const parts = value.split('-');
            return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : value;
          }}
        />
      </CardContent>
    </Card>
  );
}

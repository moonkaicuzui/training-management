import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyLineChart } from '@/components/charts/LazyCharts';
import type { DailyRecord } from '@/types/fivePrs';

interface Props {
  records: DailyRecord[];
}

export function DailyTrendChart({ records }: Props) {
  const { t } = useTranslation();

  const chartData = records.map((d) => ({
    name: d.date.slice(5), // MM-DD
    validation: d.totalValidation,
    reject: d.totalReject,
    rejectRate: d.rejectRate,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('fivePrs.dailyTrend')}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyLineChart
            data={chartData}
            height={300}
            lines={[
              {
                dataKey: 'validation',
                name: t('fivePrs.validation'),
                stroke: '#3b82f6',
                strokeWidth: 2,
              },
              {
                dataKey: 'reject',
                name: t('fivePrs.reject'),
                stroke: '#ef4444',
                strokeWidth: 2,
              },
            ]}
            xAxisKey="name"
          />
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('common.noData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

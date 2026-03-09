import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import type { GapBarChartCardProps } from './types';

export function GapBarChartCard({ data }: GapBarChartCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('skillGap.gapChart.title')}</CardTitle>
        <CardDescription>{t('skillGap.gapChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <LazyBarChart
            data={data}
            height={350}
            xAxisKey="name"
            bars={[
              {
                dataKey: 'gap',
                name: t('skillGap.gapChart.belowTarget'),
                fill: '#ef4444',
                radius: [4, 4, 0, 0],
                stackId: 'stack',
              },
              {
                dataKey: 'atTarget',
                name: t('skillGap.gapChart.atTarget'),
                fill: '#22c55e',
                radius: [4, 4, 0, 0],
                stackId: 'stack',
              },
            ]}
          />
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            {t('common.noData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

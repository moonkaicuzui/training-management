import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import type { BuildingRecord } from '@/types/fivePrs';

interface Props {
  records: BuildingRecord[];
}

export function BuildingHeatmap({ records }: Props) {
  const { t } = useTranslation();

  const chartData = records.slice(0, 15).map((b) => ({
    name: b.building,
    rejectRate: b.rejectRate,
    totalReject: b.totalReject,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('fivePrs.buildingAnalysis')}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyBarChart
            data={chartData}
            height={300}
            bars={[
              {
                dataKey: 'rejectRate',
                name: t('fivePrs.rejectRate'),
                fill: '#ef4444',
                radius: [4, 4, 0, 0],
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

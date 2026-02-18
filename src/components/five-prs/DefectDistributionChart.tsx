import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyPieChart } from '@/components/charts/LazyCharts';
import type { DefectType } from '@/types/fivePrs';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#f43f5e',
];

interface Props {
  defects: DefectType[];
}

export function DefectDistributionChart({ defects }: Props) {
  const { t } = useTranslation();

  const chartData = defects.slice(0, 8).map((d) => ({
    grade: d.type,
    count: d.count,
  }));

  const colors: Record<string, string> = {};
  chartData.forEach((item, idx) => {
    colors[item.grade] = COLORS[idx % COLORS.length];
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('fivePrs.defectDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyPieChart data={chartData} height={300} colors={colors} />
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('common.noData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

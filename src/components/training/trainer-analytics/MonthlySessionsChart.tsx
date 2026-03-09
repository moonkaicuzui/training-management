import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LazyBarChart } from '@/components/charts/LazyCharts';

interface BarConfig {
  dataKey: string;
  name: string;
  fill: string;
  radius: [number, number, number, number];
}

interface MonthlySessionsChartProps {
  data: Record<string, string | number>[];
  bars: BarConfig[];
}

export default function MonthlySessionsChart({
  data,
  bars,
}: MonthlySessionsChartProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('trainers.monthlySessionChart')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 && bars.length > 0 ? (
          <LazyBarChart
            data={data}
            bars={bars}
            height={280}
            xAxisKey="name"
          />
        ) : (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
            {t('trainers.noAnalyticsData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

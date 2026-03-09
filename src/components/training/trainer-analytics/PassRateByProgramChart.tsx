import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LazyBarChart } from '@/components/charts/LazyCharts';

interface PassRateByProgramChartProps {
  data: Record<string, string | number>[];
}

export default function PassRateByProgramChart({
  data,
}: PassRateByProgramChartProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('trainers.passRateByProgram')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <LazyBarChart
            data={data}
            bars={[
              {
                dataKey: t('trainers.passRate'),
                name: t('trainers.passRate'),
                fill: '#10b981',
                radius: [4, 4, 0, 0],
              },
            ]}
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

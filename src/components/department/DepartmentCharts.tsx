import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import type { CompletionByProgramItem, PassRateTrendItem } from './types';

interface DepartmentChartsProps {
  completionByProgram: CompletionByProgramItem[];
  passRateTrend: PassRateTrendItem[];
}

export function DepartmentCharts({ completionByProgram, passRateTrend }: DepartmentChartsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Completion by Program */}
      <Card>
        <CardHeader>
          <CardTitle>{t('departmentDashboard.completionByProgram')}</CardTitle>
        </CardHeader>
        <CardContent>
          {completionByProgram.length > 0 ? (
            <LazyBarChart
              data={completionByProgram}
              height={300}
              bars={[
                {
                  dataKey: 'completionRate',
                  name: t('departmentDashboard.completionRate'),
                  fill: '#3b82f6',
                  radius: [4, 4, 0, 0],
                },
              ]}
              xAxisKey="name"
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              {t('departmentDashboard.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pass Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('departmentDashboard.passRateTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          {passRateTrend.some((m) => m.total > 0) ? (
            <LazyBarChart
              data={passRateTrend}
              height={300}
              bars={[
                {
                  dataKey: 'passRate',
                  name: t('departmentDashboard.passRate'),
                  fill: '#10b981',
                  radius: [4, 4, 0, 0],
                },
              ]}
              xAxisKey="name"
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              {t('departmentDashboard.noData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

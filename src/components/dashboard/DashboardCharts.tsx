import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, TrendingUp, ClipboardCheck, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LazyBarChart, LazyPieChart } from '@/components/charts/LazyCharts';
import type { MonthlyTrainingData, GradeDistribution } from '@/types';

const GRADE_COLORS = {
  AA: '#059669',
  A: '#10B981',
  B: '#F59E0B',
  C: '#EF4444',
};

interface DashboardChartsProps {
  monthlyData: readonly MonthlyTrainingData[];
  gradeDistribution: readonly GradeDistribution[];
}

export function DashboardCharts({ monthlyData, gradeDistribution }: DashboardChartsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.monthlyChart')}</CardTitle>
          <CardDescription>{t('dashboard.plannedVsCompleted')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
              <div className="rounded-full bg-muted p-6 mb-4">
                <GraduationCap className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.noMonthlyData')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {t('dashboard.noMonthlyDataDesc')}
              </p>
              <Button onClick={() => navigate('/schedule')} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.scheduleTraining')}
              </Button>
            </div>
          ) : (
            <LazyBarChart
              data={monthlyData as MonthlyTrainingData[]}
              height={300}
              xAxisKey="month"
              xAxisFormatter={(value) => value.substring(5)}
              bars={[
                { dataKey: 'planned', name: t('dashboard.planned'), fill: '#93C5FD', radius: [4, 4, 0, 0] },
                { dataKey: 'completed', name: t('dashboard.completed'), fill: '#1E40AF', radius: [4, 4, 0, 0] },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Grade Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.gradeDistribution')}</CardTitle>
          <CardDescription>{t('dashboard.gradeDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {gradeDistribution.length === 0 || gradeDistribution.every(g => g.count === 0) ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
              <div className="rounded-full bg-muted p-6 mb-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.noGradeData')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {t('dashboard.noGradeDataDesc')}
              </p>
              <Button onClick={() => navigate('/results')} variant="outline" size="sm">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                {t('dashboard.enterResults')}
              </Button>
            </div>
          ) : (
            <LazyPieChart
              data={gradeDistribution as GradeDistribution[]}
              height={300}
              colors={GRADE_COLORS}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

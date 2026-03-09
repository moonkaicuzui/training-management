import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetencyRadar } from '@/components/competency/CompetencyRadar';
import type { Department } from '@/types';
import type { GapRadarChartCardProps } from './types';

export function GapRadarChartCard({
  employees,
  competencies,
  employeeCompetencies,
  deptFilter,
  categoryFilter,
}: GapRadarChartCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('skillGap.radarChart.title')}</CardTitle>
        <CardDescription>{t('skillGap.radarChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <CompetencyRadar
          employees={employees}
          competencies={
            categoryFilter !== 'all'
              ? competencies.filter((c) => c.category === categoryFilter)
              : competencies
          }
          employeeCompetencies={employeeCompetencies}
          department={deptFilter !== 'all' ? (deptFilter as Department) : undefined}
        />
      </CardContent>
    </Card>
  );
}

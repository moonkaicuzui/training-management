import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import { BUILDINGS } from '@/data/constants';
import type { Building } from '@/types';
import type { NormalizedRetrainingTarget, NormalizedExpiringTraining } from '@/types/normalized';

interface DashboardBuildingChartProps {
  retrainingTargets: readonly NormalizedRetrainingTarget[];
  expiringTrainings: readonly NormalizedExpiringTraining[];
}

export function DashboardBuildingChart({ retrainingTargets, expiringTrainings }: DashboardBuildingChartProps) {
  const { t } = useTranslation();

  const buildingStats = useMemo(() => {
    const stats = new Map<Building, { retraining: number; expiring: number }>();

    retrainingTargets.forEach((target) => {
      const building = target.employee.building;
      const existing = stats.get(building) || { retraining: 0, expiring: 0 };
      existing.retraining += 1;
      stats.set(building, existing);
    });

    expiringTrainings.forEach((item) => {
      const building = item.employee.building;
      const existing = stats.get(building) || { retraining: 0, expiring: 0 };
      existing.expiring += 1;
      stats.set(building, existing);
    });

    return BUILDINGS
      .map((b) => {
        const data = stats.get(b.value) || { retraining: 0, expiring: 0 };
        return {
          building: b.label,
          retraining: data.retraining,
          expiring: data.expiring,
        };
      })
      .filter((d) => d.retraining > 0 || d.expiring > 0);
  }, [retrainingTargets, expiringTrainings]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>{t('extendedDashboard.locationAnalysis')}</CardTitle>
            <CardDescription>{t('extendedDashboard.buildingAnalysis')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {buildingStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="rounded-full bg-muted p-6 mb-4">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('extendedDashboard.noLocationData')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('extendedDashboard.noLocationDataDesc')}
            </p>
          </div>
        ) : (
          <LazyBarChart
            data={buildingStats}
            height={300}
            xAxisKey="building"
            bars={[
              {
                dataKey: 'retraining',
                name: t('extendedDashboard.retrainingCount'),
                fill: '#EF4444',
                radius: [4, 4, 0, 0],
              },
              {
                dataKey: 'expiring',
                name: t('extendedDashboard.expiringCount'),
                fill: '#F59E0B',
                radius: [4, 4, 0, 0],
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}

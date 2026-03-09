import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TotalStats {
  totalEmployees: number;
  totalTrainings: number;
  passRate: number;
  activePrograms: number;
}

interface ReportSummaryCardsProps {
  totalStats: TotalStats;
}

export function ReportSummaryCards({ totalStats }: ReportSummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalEmployees}</p>
              <p className="text-xs text-muted-foreground">{t('reports.totalEmployees')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalTrainings}</p>
              <p className="text-xs text-muted-foreground">{t('reports.totalTrainings')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.passRate}%</p>
              <p className="text-xs text-muted-foreground">{t('reports.avgPassRate')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.activePrograms}</p>
              <p className="text-xs text-muted-foreground">{t('reports.activePrograms')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

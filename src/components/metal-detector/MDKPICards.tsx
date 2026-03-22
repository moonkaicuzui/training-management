import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert, Wrench, RefreshCw, AlertTriangle, Users } from 'lucide-react';
import type { MDWeeklyComparison, MDRepeatedIssueSummary } from '@/types/metalDetector';
import type { HRSummary } from '@/services/api';

interface MDKPICardsProps {
  comp: MDWeeklyComparison | null;
  repeatedIssues: MDRepeatedIssueSummary | null;
  hrData: HRSummary | null;
}

export default function MDKPICards({ comp, repeatedIssues, hrData }: MDKPICardsProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('metalDetector.weeklyReport.kpiSummary')}</CardTitle>
          {hrData && (
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {t('dashboard.hr.activeHeadcount')}: {hrData.activeHeadcount.toLocaleString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.totalChecked')}</p>
            <p className="text-2xl font-bold">{comp?.thisWeek.totalChecked ?? 0}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <ShieldAlert className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.failedLastWeek')}</p>
            <p className="text-2xl font-bold">{comp?.lastWeek.failCount ?? 0}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <ShieldAlert className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.failedThisWeek')}</p>
            <p className="text-2xl font-bold text-red-600">{comp?.thisWeek.failCount ?? 0}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Wrench className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.fixedOnTime')}</p>
            <p className="text-2xl font-bold">{comp?.machinesFixedOnTime ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              {comp ? `${comp.machinesFixedOnTime}/${comp.machinesFailedLastWeek}` : '0/0'}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Wrench className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.maintenanceFixRate')}</p>
            <p className="text-2xl font-bold text-green-600">
              {comp ? `${comp.maintenanceFixRate.toFixed(0)}%` : '0%'}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <RefreshCw className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.repeatedIssues')}</p>
            <p className="text-2xl font-bold">{repeatedIssues?.repeatedCount ?? 0}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.repeatedRate')}</p>
            <p className="text-2xl font-bold">
              {repeatedIssues ? `${repeatedIssues.repeatedRate.toFixed(1)}%` : '0%'}
            </p>
            <p className="text-xs text-muted-foreground">
              {repeatedIssues ? `${repeatedIssues.repeatedCount}/${repeatedIssues.totalInspected}` : '0/0'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

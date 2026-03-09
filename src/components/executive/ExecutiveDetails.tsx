/**
 * Executive Dashboard - HQ Report Preview & Detail Sections
 * 본사 리포트 미리보기 컴포넌트
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Building2,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ExecutiveKPI } from '@/types/executive';

// ========== HQ Report Preview ==========

export interface HQReportPreviewProps {
  kpis: ExecutiveKPI[];
  totalEmployees: number;
  completionRate: number;
  trendVsLast: number;
  roi: number;
}

export const HQReportPreview = memo(function HQReportPreview({
  kpis,
  totalEmployees,
  completionRate,
  trendVsLast,
  roi,
}: HQReportPreviewProps) {
  const { t } = useTranslation();
  const now = new Date();
  const periodStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  const achievements = kpis
    .filter(k => k.status === 'achieved')
    .map(k => `${k.title} ${t('executive.hqTargetAchieved')} (${k.value}${k.unit} vs ${t('executive.hqKPITarget')} ${k.target}${k.unit})`);

  const riskItems = kpis
    .filter(k => k.status === 'at-risk' || k.status === 'missed')
    .map(k => ({
      severity: (k.status === 'missed' ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
      description: `${k.title} ${k.value}${k.unit} (${t('executive.hqKPITarget')}: ${k.target}${k.unit})`,
      action: t('executive.hqAssignAndImprove'),
    }));

  if (riskItems.length === 0) {
    // Add default if no risk items
    const belowTarget = kpis.filter(k => k.status === 'on-track' && k.value < k.target);
    if (belowTarget.length > 0) {
      riskItems.push({
        severity: 'LOW',
        description: `${belowTarget[0].title} ${t('executive.hqTargetBelow')} (${belowTarget[0].value}${belowTarget[0].unit})`,
        action: t('executive.hqMonitorAndImprove'),
      });
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Badge className="bg-green-500">{t('executive.hqStatusAchieved')}</Badge>;
      case 'on-track':
        return <Badge className="bg-blue-500">{t('executive.hqStatusInProgress')}</Badge>;
      case 'at-risk':
        return <Badge className="bg-yellow-500">{t('executive.hqStatusWarning')}</Badge>;
      default:
        return <Badge className="bg-red-500">{t('executive.hqStatusBelow')}</Badge>;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-muted/50">
        <div className="text-center">
          <h2 className="text-xl font-bold">HWK Vietnam</h2>
          <h3 className="text-lg font-semibold text-muted-foreground">
            {t('executive.hqPreviewTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t('executive.hqPreviewPeriod')} {periodStr}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Executive Summary */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Executive Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{totalEmployees}</p>
              <p className="text-xs text-muted-foreground">{t('executive.hqTotalEmployees')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">{t('executive.hqCompletionRate')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                {trendVsLast > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                {Math.abs(trendVsLast)}%
              </p>
              <p className="text-xs text-muted-foreground">{t('executive.hqVsLastMonth')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{roi}%</p>
              <p className="text-xs text-muted-foreground">{t('executive.hqPassRate')}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* KPI 현황 */}
        <div>
          <h4 className="font-semibold mb-3">{t('executive.hqKPITitle')}</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">{t('executive.hqKPIName')}</th>
                <th className="text-right py-2">{t('executive.hqKPIActual')}</th>
                <th className="text-right py-2">{t('executive.hqKPITarget')}</th>
                <th className="text-right py-2">{t('executive.hqKPIVsLastMonth')}</th>
                <th className="text-center py-2">{t('executive.hqKPIStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => (
                <tr key={kpi.id} className="border-b">
                  <td className="py-2">{kpi.title}</td>
                  <td className="text-right py-2 font-medium">{kpi.value}{kpi.unit}</td>
                  <td className="text-right py-2 text-muted-foreground">{kpi.target}{kpi.unit}</td>
                  <td className="text-right py-2">
                    <span className={kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {kpi.trend > 0 ? '+' : ''}
                      {kpi.trend}%
                    </span>
                  </td>
                  <td className="text-center py-2">{getStatusBadge(kpi.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator />

        {/* 주요 성과 & 리스크 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t('executive.hqKeyAchievements')}
            </h4>
            <ul className="space-y-2">
              {achievements.length > 0 ? achievements.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500">•</span>
                  {item}
                </li>
              )) : (
                <li className="text-sm text-muted-foreground">{t('executive.hqDataCollecting')}</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {t('executive.hqRiskItems')}
            </h4>
            <ul className="space-y-2">
              {riskItems.map((item) => (
                <li key={item.description} className="text-sm p-2 bg-muted rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={item.severity === 'HIGH' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.severity}
                    </Badge>
                    {item.description}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('executive.hqAction')} {item.action}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        {/* 차기 계획 */}
        <div>
          <h4 className="font-semibold mb-3">{t('executive.hqNextPlan')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('executive.hqNextPlanDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

// ========== Report Tab (HQ Report wrapper) ==========

interface ReportTabProps {
  executiveKPIs: ExecutiveKPI[];
  totalEmployees: number;
  completionRate: number;
  passRate: number;
  onExportExcel: () => void;
}

export function ReportTab({
  executiveKPIs,
  totalEmployees,
  completionRate,
  passRate,
  onExportExcel,
}: ReportTabProps) {
  const { t } = useTranslation();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('executive.hqReportTitle')}
              </CardTitle>
              <CardDescription>
                {t('executive.hqReportDesc')}
              </CardDescription>
            </div>
            <Button onClick={onExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              {t('executive.excelDownload')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <HQReportPreview
        kpis={executiveKPIs}
        totalEmployees={totalEmployees}
        completionRate={completionRate}
        trendVsLast={0}
        roi={passRate}
      />
    </>
  );
}

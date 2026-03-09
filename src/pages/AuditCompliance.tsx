/**
 * Audit Compliance Page
 * 아디다스 감사 대응 - 교육 규정 준수 현황 및 리포트
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryCard, calculateCategorySummaries, categoryI18nKeys } from '@/components/audit/AuditCategoryCard';
import { AuditFindingsView, AuditActionsView } from '@/components/audit/AuditDetailView';
import type {
  AuditComplianceMetric,
  AuditFinding,
  CorrectiveAction,
} from '@/types/executive';
import * as api from '@/services/api';

export default function AuditCompliance() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState<AuditComplianceMetric[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [metricsData, findingsData, actionsData] = await Promise.all([
        api.getAuditMetrics(),
        api.getAuditFindings(),
        api.getCorrectiveActions(),
      ]);
      setMetrics(metricsData);
      setFindings(findingsData);
      setCorrectiveActions(actionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categorySummaries = useMemo(
    () => calculateCategorySummaries(metrics),
    [metrics]
  );

  const overallStats = useMemo(() => {
    const total = metrics.length;
    const compliant = metrics.filter((m) => m.currentStatus === 'COMPLIANT').length;
    const partial = metrics.filter((m) => m.currentStatus === 'PARTIAL').length;
    const nonCompliant = metrics.filter((m) => m.currentStatus === 'NON_COMPLIANT').length;
    const score = total > 0 ? Math.round(((compliant + partial * 0.5) / total) * 100) : 0;

    let status: 'PASS' | 'CONDITIONAL_PASS' | 'FAIL';
    if (nonCompliant > 0) {
      status = 'FAIL';
    } else if (partial > 0) {
      status = 'CONDITIONAL_PASS';
    } else {
      status = 'PASS';
    }

    return { total, compliant, partial, nonCompliant, score, status };
  }, [metrics]);

  const filteredMetrics = useMemo(() => {
    return metrics.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.requirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || m.currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [metrics, searchQuery, statusFilter]);

  const handleExportExcel = useCallback(async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const summaryData = [
      [t('auditCompliance.exportReportTitle')],
      [''],
      [t('auditCompliance.exportGeneratedDate'), new Date().toISOString().split('T')[0]],
      [t('auditCompliance.exportOverallScore'), `${overallStats.score}%`],
      [
        t('auditCompliance.exportOverallStatus'),
        overallStats.status === 'PASS'
          ? t('auditCompliance.overallStatusPass')
          : overallStats.status === 'CONDITIONAL_PASS'
            ? t('auditCompliance.overallStatusConditional')
            : t('auditCompliance.overallStatusFail'),
      ],
      [''],
      [t('auditCompliance.exportCategoryStatus')],
      [t('auditCompliance.exportColCategory'), t('auditCompliance.exportColCompliant'), t('auditCompliance.exportColPartial'), t('auditCompliance.exportColNonCompliant'), t('auditCompliance.exportColScore'), t('auditCompliance.exportColStatus')],
      ...categorySummaries.map((s) => [
        t(s.categoryName),
        s.compliantCount,
        s.partialCount,
        s.nonCompliantCount,
        `${s.score}%`,
        s.status === 'PASS' ? t('auditCompliance.categoryStatusPass') : s.status === 'ATTENTION' ? t('auditCompliance.categoryStatusWarning') : t('auditCompliance.categoryStatusFail'),
      ]),
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, t('auditCompliance.exportSheetSummary'));

    const detailHeader = [
      t('auditCompliance.exportDetailId'), t('auditCompliance.exportDetailCategory'),
      t('auditCompliance.exportDetailRequirement'), t('auditCompliance.exportDetailDescription'),
      t('auditCompliance.exportDetailStatus'), t('auditCompliance.exportDetailCurrentVal'),
      t('auditCompliance.exportDetailTargetVal'), t('auditCompliance.exportDetailAction'),
      t('auditCompliance.exportDetailLastChecked'),
    ];
    const detailRows = metrics.map((m) => [
      m.id, t(categoryI18nKeys[m.category]), m.requirement, m.description,
      m.currentStatus === 'COMPLIANT' ? t('auditCompliance.exportDetailStatusCompliant')
        : m.currentStatus === 'PARTIAL' ? t('auditCompliance.exportDetailStatusPartial')
          : m.currentStatus === 'NON_COMPLIANT' ? t('auditCompliance.exportDetailStatusNonCompliant')
            : t('auditCompliance.exportDetailStatusNA'),
      m.currentValue !== undefined ? `${m.currentValue}${m.unit || ''}` : '-',
      m.targetValue !== undefined ? `${m.targetValue}${m.unit || ''}` : '-',
      m.actionRequired || '-', m.lastChecked,
    ]);
    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
    XLSX.utils.book_append_sheet(wb, wsDetail, t('auditCompliance.exportSheetDetails'));

    const findingsHeader = [
      t('auditCompliance.exportFindingId'), t('auditCompliance.exportFindingSeverity'),
      t('auditCompliance.exportFindingCategory'), t('auditCompliance.exportFindingDescription'),
      t('auditCompliance.exportFindingRequirement'), t('auditCompliance.exportFindingRecommendation'),
    ];
    const findingsRows = findings.map((f) => [
      f.id, f.severity, t(categoryI18nKeys[f.category]), f.description, f.requirement, f.recommendation,
    ]);
    const wsFindings = XLSX.utils.aoa_to_sheet([findingsHeader, ...findingsRows]);
    XLSX.utils.book_append_sheet(wb, wsFindings, t('auditCompliance.exportSheetFindings'));

    const actionsHeader = [
      t('auditCompliance.exportActionId'), t('auditCompliance.exportActionRelatedFinding'),
      t('auditCompliance.exportActionContent'), t('auditCompliance.exportActionResponsible'),
      t('auditCompliance.exportActionTargetDate'), t('auditCompliance.exportActionStatus'),
      t('auditCompliance.exportActionCompletedDate'),
    ];
    const actionsRows = correctiveActions.map((a) => [
      a.id, a.findingId, a.action, a.responsiblePerson, a.targetDate,
      a.status === 'COMPLETED' ? t('auditCompliance.actionCompleted')
        : a.status === 'IN_PROGRESS' ? t('auditCompliance.actionInProgress')
          : a.status === 'PENDING' ? t('auditCompliance.actionPending')
            : t('auditCompliance.actionOverdue'),
      a.completedDate || '-',
    ]);
    const wsActions = XLSX.utils.aoa_to_sheet([actionsHeader, ...actionsRows]);
    XLSX.utils.book_append_sheet(wb, wsActions, t('auditCompliance.exportSheetActions'));

    const filename = `${t('auditCompliance.exportFilename')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [metrics, findings, correctiveActions, overallStats, categorySummaries]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            {t('auditCompliance.title')}
          </h1>
          <p className="text-muted-foreground">{t('auditCompliance.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('auditCompliance.refresh')}
          </Button>
          <Button onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            {t('auditCompliance.exportExcel')}
          </Button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">{t('auditCompliance.loadingData')}</span>
          </CardContent>
        </Card>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('auditCompliance.retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 전체 현황 요약 */}
      {!isLoading && !error && (<>
      <div className="grid gap-4 md:grid-cols-5">
        <Card
          className={`col-span-2 ${
            overallStats.status === 'PASS'
              ? 'border-green-500'
              : overallStats.status === 'CONDITIONAL_PASS'
                ? 'border-yellow-500'
                : 'border-red-500'
          } border-2`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('auditCompliance.overallComplianceRate')}</p>
                <p className="text-4xl font-bold">{overallStats.score}%</p>
                <Badge
                  className={`mt-2 ${
                    overallStats.status === 'PASS'
                      ? 'bg-green-500'
                      : overallStats.status === 'CONDITIONAL_PASS'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                >
                  {overallStats.status === 'PASS'
                    ? t('auditCompliance.overallStatusPass')
                    : overallStats.status === 'CONDITIONAL_PASS'
                      ? t('auditCompliance.overallStatusConditional')
                      : t('auditCompliance.overallStatusFail')}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{t('auditCompliance.compliantCount')} {overallStats.compliant}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>{t('auditCompliance.partialCount')} {overallStats.partial}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{t('auditCompliance.nonCompliantCount')} {overallStats.nonCompliant}</span>
                </div>
              </div>
            </div>
            <Progress value={overallStats.score} className="mt-4 h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{findings.length}</p>
                <p className="text-xs text-muted-foreground">{t('auditCompliance.findings')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {correctiveActions.filter((a) => a.status === 'IN_PROGRESS').length}
                </p>
                <p className="text-xs text-muted-foreground">{t('auditCompliance.ongoingActions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {correctiveActions.filter((a) => a.status === 'COMPLETED').length}
                </p>
                <p className="text-xs text-muted-foreground">{t('auditCompliance.completedActions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t('auditCompliance.tabOverview')}</TabsTrigger>
          <TabsTrigger value="findings">{t('auditCompliance.tabFindings')}</TabsTrigger>
          <TabsTrigger value="actions">{t('auditCompliance.tabActions')}</TabsTrigger>
        </TabsList>

        {/* 카테고리별 현황 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('auditCompliance.searchRequirements')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('auditCompliance.filterAll')}</SelectItem>
                <SelectItem value="COMPLIANT">{t('auditCompliance.filterCompliant')}</SelectItem>
                <SelectItem value="PARTIAL">{t('auditCompliance.filterPartial')}</SelectItem>
                <SelectItem value="NON_COMPLIANT">{t('auditCompliance.filterNonCompliant')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {categorySummaries.map((summary) => {
              const categoryMetrics = filteredMetrics.filter(
                (m) => m.category === summary.category
              );
              if (categoryMetrics.length === 0 && statusFilter !== 'all') return null;

              return (
                <CategoryCard
                  key={summary.category}
                  summary={summary}
                  metrics={
                    statusFilter === 'all'
                      ? metrics.filter((m) => m.category === summary.category)
                      : categoryMetrics
                  }
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <AuditFindingsView findings={findings} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <AuditActionsView correctiveActions={correctiveActions} findings={findings} />
        </TabsContent>
      </Tabs>
      </>)}
    </div>
  );
}

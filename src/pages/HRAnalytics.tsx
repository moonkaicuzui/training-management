/**
 * HR 연계 분석 대시보드
 *
 * 6개 탭으로 구성:
 * 1. 교육 효과 (Training Effectiveness)
 * 2. 위험 직원 교육 (Risk-Based Training)
 * 3. 신입 교육 현황 (New Hire Training)
 * 4. 품질 데이터 비교 (Quality Data Sync)
 * 5. 부서별 교육 완료율 (Department Completion)
 * 6. 이직률 분석 (Turnover Analysis)
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  UserPlus,
  RefreshCcw,
  Building2,
  BarChart3,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LazyBarChart, LazyLineChart } from '@/components/charts/LazyCharts';
import {
  analyzeTrainingEffectiveness,
  getHighRiskTrainingRecommendations,
  getNewHireTrainingStatus,
  compareQualityData,
  getDepartmentTrainingRates,
  analyzeTurnoverTrainingCorrelation,
  type TrainingEffectivenessResult,
  type RiskBasedRecommendation,
  type NewHireTrainingStatus,
  type QualitySync,
  type DepartmentTrainingRate,
  type TurnoverTrainingCorrelation,
} from '@/services/hrAnalyticsService';

// ─── Constants ─────────────────────────────────────────
const MONTH_OPTIONS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const currentDate = new Date();
const DEFAULT_MONTH = MONTH_OPTIONS[currentDate.getMonth()];
const DEFAULT_YEAR = currentDate.getFullYear();

// ─── Helper Components ─────────────────────────────────

function MonthYearSelector({
  month, year, onMonthChange, onYearChange,
}: {
  month: string; year: number;
  onMonthChange: (m: string) => void;
  onYearChange: (y: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((m) => (
            <SelectItem key={m} value={m}>
              {t(`hrAnalytics.months.${m}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[2024, 2025, 2026, 2027].map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Icon className="h-5 w-5 text-muted-foreground" />
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskBadge({ level }: { level: string }) {
  const { t } = useTranslation();
  const variant = level === 'high' ? 'destructive' : level === 'medium' ? 'default' : 'secondary';
  return <Badge variant={variant}>{t(`hrAnalytics.riskLevel.${level}`)}</Badge>;
}

function TqcStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const variant =
    status === 'completed' ? 'default'
      : status === 'in_training' ? 'secondary'
        : status === 'failed' ? 'destructive'
          : 'outline';
  return <Badge variant={variant}>{t(`hrAnalytics.tqcStatus.${status}`)}</Badge>;
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <p>{message}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────

export default function HRAnalytics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('effectiveness');
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);

  // Tab 1: 교육 효과
  const [effectivenessData, setEffectivenessData] = useState<TrainingEffectivenessResult[]>([]);
  const [effectivenessLoading, setEffectivenessLoading] = useState(false);

  // Tab 2: 위험 직원
  const [riskData, setRiskData] = useState<RiskBasedRecommendation[]>([]);
  const [riskLoading, setRiskLoading] = useState(false);

  // Tab 3: 신입 교육
  const [newHireData, setNewHireData] = useState<NewHireTrainingStatus[]>([]);
  const [newHireLoading, setNewHireLoading] = useState(false);

  // Tab 4: 품질 비교
  const [qualityData, setQualityData] = useState<QualitySync[]>([]);
  const [qualityLoading, setQualityLoading] = useState(false);

  // Tab 5: 부서별
  const [deptData, setDeptData] = useState<DepartmentTrainingRate[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // Tab 6: 이직률
  const [turnoverData, setTurnoverData] = useState<TurnoverTrainingCorrelation[]>([]);
  const [turnoverLoading, setTurnoverLoading] = useState(false);

  // ─── Data Fetching ─────────────────────────────

  const loadEffectiveness = useCallback(async () => {
    setEffectivenessLoading(true);
    try {
      const data = await analyzeTrainingEffectiveness(month, year);
      setEffectivenessData(data);
    } finally {
      setEffectivenessLoading(false);
    }
  }, [month, year]);

  const loadRisk = useCallback(async () => {
    setRiskLoading(true);
    try {
      const data = await getHighRiskTrainingRecommendations(month, year);
      setRiskData(data);
    } finally {
      setRiskLoading(false);
    }
  }, [month, year]);

  const loadNewHire = useCallback(async () => {
    setNewHireLoading(true);
    try {
      const data = await getNewHireTrainingStatus(month, year);
      setNewHireData(data);
    } finally {
      setNewHireLoading(false);
    }
  }, [month, year]);

  const loadQuality = useCallback(async () => {
    setQualityLoading(true);
    try {
      const data = await compareQualityData(month, year);
      setQualityData(data);
    } finally {
      setQualityLoading(false);
    }
  }, [month, year]);

  const loadDept = useCallback(async () => {
    setDeptLoading(true);
    try {
      const data = await getDepartmentTrainingRates();
      setDeptData(data);
    } finally {
      setDeptLoading(false);
    }
  }, []);

  const loadTurnover = useCallback(async () => {
    setTurnoverLoading(true);
    try {
      const data = await analyzeTurnoverTrainingCorrelation(6);
      setTurnoverData(data);
    } finally {
      setTurnoverLoading(false);
    }
  }, []);

  // ─── Render ────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('hrAnalytics.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('hrAnalytics.description')}
          </p>
        </div>
        <MonthYearSelector
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="effectiveness">{t('hrAnalytics.tabs.effectiveness')}</TabsTrigger>
          <TabsTrigger value="risk">{t('hrAnalytics.tabs.risk')}</TabsTrigger>
          <TabsTrigger value="newHire">{t('hrAnalytics.tabs.newHire')}</TabsTrigger>
          <TabsTrigger value="quality">{t('hrAnalytics.tabs.quality')}</TabsTrigger>
          <TabsTrigger value="department">{t('hrAnalytics.tabs.department')}</TabsTrigger>
          <TabsTrigger value="turnover">{t('hrAnalytics.tabs.turnover')}</TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: 교육 효과 ─── */}
        <TabsContent value="effectiveness" className="space-y-4">
          <div className="flex items-center justify-between">
            <CardDescription>{t('hrAnalytics.effectiveness.description')}</CardDescription>
            <Button onClick={loadEffectiveness} disabled={effectivenessLoading} size="sm">
              {effectivenessLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              {t('hrAnalytics.loadData')}
            </Button>
          </div>

          {effectivenessData.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <KPICard
                title={t('hrAnalytics.effectiveness.totalAnalyzed')}
                value={effectivenessData.length}
                icon={BarChart3}
              />
              <KPICard
                title={t('hrAnalytics.effectiveness.avgRiskChange')}
                value={
                  effectivenessData.filter((d) => d.improvement.riskChange !== undefined).length > 0
                    ? `${(effectivenessData
                        .filter((d) => d.improvement.riskChange !== undefined)
                        .reduce((s, d) => s + (d.improvement.riskChange || 0), 0) /
                        effectivenessData.filter((d) => d.improvement.riskChange !== undefined).length
                      ).toFixed(1)}`
                    : '-'
                }
                icon={TrendingDown}
                trend="down"
              />
              <KPICard
                title={t('hrAnalytics.effectiveness.avgAqlChange')}
                value={
                  effectivenessData.filter((d) => d.improvement.aqlChange !== undefined).length > 0
                    ? `${(effectivenessData
                        .filter((d) => d.improvement.aqlChange !== undefined)
                        .reduce((s, d) => s + (d.improvement.aqlChange || 0), 0) /
                        effectivenessData.filter((d) => d.improvement.aqlChange !== undefined).length
                      ).toFixed(1)}%`
                    : '-'
                }
                icon={TrendingUp}
                trend="up"
              />
            </div>
          )}

          {effectivenessLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : effectivenessData.length === 0 ? (
            <EmptyMessage message={t('hrAnalytics.empty.effectiveness')} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                      <TableHead>{t('hrAnalytics.table.program')}</TableHead>
                      <TableHead>{t('hrAnalytics.table.date')}</TableHead>
                      <TableHead className="text-right">{t('hrAnalytics.effectiveness.before')}</TableHead>
                      <TableHead className="text-right">{t('hrAnalytics.effectiveness.after')}</TableHead>
                      <TableHead className="text-right">{t('hrAnalytics.effectiveness.change')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effectivenessData.slice(0, 50).map((row, idx) => (
                      <TableRow key={`${row.employeeId}-${row.programCode}-${idx}`}>
                        <TableCell className="font-medium">{row.employeeName}</TableCell>
                        <TableCell>{row.programCode}</TableCell>
                        <TableCell>{row.trainingDate}</TableCell>
                        <TableCell className="text-right">
                          {row.beforeMetrics.riskScore ?? '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.afterMetrics.riskScore ?? '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.improvement.riskChange !== undefined ? (
                            <span className={row.improvement.riskChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {row.improvement.riskChange > 0 ? '-' : '+'}{Math.abs(row.improvement.riskChange).toFixed(1)}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 2: 위험 직원 교육 ─── */}
        <TabsContent value="risk" className="space-y-4">
          <div className="flex items-center justify-between">
            <CardDescription>{t('hrAnalytics.risk.description')}</CardDescription>
            <Button onClick={loadRisk} disabled={riskLoading} size="sm">
              {riskLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              {t('hrAnalytics.loadData')}
            </Button>
          </div>

          {riskLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : riskData.length === 0 ? (
            <EmptyMessage message={t('hrAnalytics.empty.risk')} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                      <TableHead>{t('hrAnalytics.table.team')}</TableHead>
                      <TableHead>{t('hrAnalytics.table.building')}</TableHead>
                      <TableHead className="text-center">{t('hrAnalytics.risk.score')}</TableHead>
                      <TableHead>{t('hrAnalytics.risk.level')}</TableHead>
                      <TableHead>{t('hrAnalytics.risk.factors')}</TableHead>
                      <TableHead>{t('hrAnalytics.risk.recommended')}</TableHead>
                      <TableHead>{t('hrAnalytics.risk.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskData.map((row) => (
                      <TableRow
                        key={row.employeeId}
                        className={
                          row.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-950/20'
                            : row.riskLevel === 'medium' ? 'bg-orange-50 dark:bg-orange-950/20'
                              : ''
                        }
                      >
                        <TableCell className="font-medium">
                          <Link to={`/employees/${row.employeeId}`} className="hover:underline text-blue-600">
                            {row.employeeName}
                          </Link>
                        </TableCell>
                        <TableCell>{row.team}</TableCell>
                        <TableCell>{row.building}</TableCell>
                        <TableCell className="text-center font-bold">{row.riskScore}</TableCell>
                        <TableCell><RiskBadge level={row.riskLevel} /></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.riskFactors.map((f, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.recommendedPrograms.map((p) => (
                              <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TqcStatusBadge status={row.currentTrainingStatus === 'none' ? 'not_enrolled' : row.currentTrainingStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 3: 신입 교육 현황 ─── */}
        <TabsContent value="newHire" className="space-y-4">
          <div className="flex items-center justify-between">
            <CardDescription>{t('hrAnalytics.newHire.description')}</CardDescription>
            <Button onClick={loadNewHire} disabled={newHireLoading} size="sm">
              {newHireLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {t('hrAnalytics.loadData')}
            </Button>
          </div>

          {newHireData.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-4">
              <KPICard
                title={t('hrAnalytics.newHire.totalNewHires')}
                value={newHireData.length}
                icon={UserPlus}
              />
              <KPICard
                title={t('hrAnalytics.newHire.tqcEnrolled')}
                value={newHireData.filter((d) => d.tqcStatus !== 'not_enrolled').length}
                icon={BarChart3}
              />
              <KPICard
                title={t('hrAnalytics.newHire.tqcCompleted')}
                value={newHireData.filter((d) => d.tqcStatus === 'completed').length}
                icon={TrendingUp}
              />
              <KPICard
                title={t('hrAnalytics.newHire.avgCompletion')}
                value={`${newHireData.length > 0
                  ? Math.round(newHireData.reduce((s, d) => s + d.completionRate, 0) / newHireData.length)
                  : 0}%`}
                icon={BarChart3}
              />
            </div>
          )}

          {newHireLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : newHireData.length === 0 ? (
            <EmptyMessage message={t('hrAnalytics.empty.newHire')} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                      <TableHead>{t('hrAnalytics.newHire.hireDate')}</TableHead>
                      <TableHead>{t('hrAnalytics.table.team')}</TableHead>
                      <TableHead className="text-center">{t('hrAnalytics.newHire.daysEmployed')}</TableHead>
                      <TableHead>{t('hrAnalytics.newHire.tqcStatusLabel')}</TableHead>
                      <TableHead className="text-right">{t('hrAnalytics.newHire.completionRate')}</TableHead>
                      <TableHead>{t('hrAnalytics.newHire.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newHireData.map((row) => (
                      <TableRow
                        key={row.employeeId}
                        className={row.daysEmployed < 30 ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                      >
                        <TableCell className="font-medium">{row.employeeName}</TableCell>
                        <TableCell>{row.hireDate}</TableCell>
                        <TableCell>{row.team}</TableCell>
                        <TableCell className="text-center">
                          {row.daysEmployed}
                          {row.daysEmployed < 60 && (
                            <Badge variant="outline" className="ml-1 text-xs">&lt;60</Badge>
                          )}
                        </TableCell>
                        <TableCell><TqcStatusBadge status={row.tqcStatus} /></TableCell>
                        <TableCell className="text-right">
                          <span className={row.completionRate >= 80 ? 'text-green-600' : row.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                            {row.completionRate}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {row.tqcStatus === 'not_enrolled' && (
                            <Link to="/new-tqc/trainees">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {t('hrAnalytics.newHire.enrollTqc')}
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 4: 품질 데이터 비교 ─── */}
        <TabsContent value="quality" className="space-y-4">
          <div className="flex items-center justify-between">
            <CardDescription>{t('hrAnalytics.quality.description')}</CardDescription>
            <Button onClick={loadQuality} disabled={qualityLoading} size="sm">
              {qualityLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              {t('hrAnalytics.loadData')}
            </Button>
          </div>

          {qualityLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : qualityData.length === 0 ? (
            <EmptyMessage message={t('hrAnalytics.empty.quality')} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('hrAnalytics.quality.comparisonTitle')}
                  <Badge variant="outline" className="ml-2">
                    {qualityData.filter((d) => d.discrepancy).length} {t('hrAnalytics.quality.discrepancies')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                      <TableHead className="text-right">{t('hrAnalytics.quality.qtrainAql')}</TableHead>
                      <TableHead className="text-right">{t('hrAnalytics.quality.hrV2Aql')}</TableHead>
                      <TableHead>{t('hrAnalytics.quality.inspGrade')}</TableHead>
                      <TableHead className="text-center">{t('hrAnalytics.quality.match')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityData.slice(0, 50).map((row) => (
                      <TableRow
                        key={row.employeeId}
                        className={row.discrepancy ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      >
                        <TableCell className="font-medium">{row.employeeName}</TableCell>
                        <TableCell className="text-right">
                          {row.qtrain.aqlFailRate !== undefined ? `${row.qtrain.aqlFailRate.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.hrV2.aqlPassRate !== undefined ? `${row.hrV2.aqlPassRate.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>{row.qtrain.inspectionGrade || '-'}</TableCell>
                        <TableCell className="text-center">
                          {row.discrepancy ? (
                            <Badge variant="destructive">{t('hrAnalytics.quality.mismatch')}</Badge>
                          ) : (
                            <Badge variant="secondary">{t('hrAnalytics.quality.ok')}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 5: 부서별 교육 완료율 ─── */}
        <TabsContent value="department" className="space-y-4">
          <div className="flex items-center justify-between">
            <CardDescription>{t('hrAnalytics.department.description')}</CardDescription>
            <Button onClick={loadDept} disabled={deptLoading} size="sm">
              {deptLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
              {t('hrAnalytics.loadData')}
            </Button>
          </div>

          {deptLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : deptData.length === 0 ? (
            <EmptyMessage message={t('hrAnalytics.empty.department')} />
          ) : (
            <>
              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('hrAnalytics.department.chartTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyBarChart
                    data={deptData.map((d) => ({
                      name: d.department,
                      completionRate: d.completionRate,
                      passRate: d.passRate,
                    }))}
                    height={300}
                    bars={[
                      { dataKey: 'completionRate', name: t('hrAnalytics.department.completionRate'), fill: '#3b82f6' },
                      { dataKey: 'passRate', name: t('hrAnalytics.department.passRate'), fill: '#22c55e' },
                    ]}
                    xAxisKey="name"
                  />
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('hrAnalytics.department.dept')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.department.active')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.department.completionRate')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.department.avgScore')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.department.passRate')}</TableHead>
                        <TableHead>{t('hrAnalytics.department.topPerformers')}</TableHead>
                        <TableHead>{t('hrAnalytics.department.needsAttention')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deptData.map((row) => (
                        <TableRow key={row.department}>
                          <TableCell className="font-medium">{row.department}</TableCell>
                          <TableCell className="text-right">{row.activeEmployees}</TableCell>
                          <TableCell className="text-right">
                            <span className={row.completionRate >= 80 ? 'text-green-600' : row.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                              {row.completionRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{row.avgScore || '-'}</TableCell>
                          <TableCell className="text-right">{row.passRate}%</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {row.topPerformers.map((n, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {row.needsAttention.slice(0, 3).map((n, i) => (
                                <Badge key={i} variant="destructive" className="text-xs">{n}</Badge>
                              ))}
                              {row.needsAttention.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{row.needsAttention.length - 3}</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ─── Tab 6: 이직률 분석 ─── */}
        <TabsContent value="turnover" className="space-y-4">
          <div className="flex items-center justify-between">
            <CardDescription>{t('hrAnalytics.turnover.description')}</CardDescription>
            <Button onClick={loadTurnover} disabled={turnoverLoading} size="sm">
              {turnoverLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
              {t('hrAnalytics.loadData')}
            </Button>
          </div>

          {turnoverLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : turnoverData.length === 0 ? (
            <EmptyMessage message={t('hrAnalytics.empty.turnover')} />
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <KPICard
                  title={t('hrAnalytics.turnover.trainingRetention')}
                  value={`${turnoverData[turnoverData.length - 1]?.trainingRetentionRate ?? 0}%`}
                  subtitle={t('hrAnalytics.turnover.trainedRetention')}
                  icon={TrendingUp}
                  trend="up"
                />
                <KPICard
                  title={t('hrAnalytics.turnover.noTrainingRetention')}
                  value={`${turnoverData[turnoverData.length - 1]?.noTrainingRetentionRate ?? 0}%`}
                  subtitle={t('hrAnalytics.turnover.untrainedRetention')}
                  icon={TrendingDown}
                  trend="down"
                />
                <KPICard
                  title={t('hrAnalytics.turnover.tqcSurvival')}
                  value={`${turnoverData[turnoverData.length - 1]?.tqcCompletionSurvivalRate ?? 0}%`}
                  subtitle={t('hrAnalytics.turnover.tqcSurvivalDesc')}
                  icon={BarChart3}
                />
              </div>

              {/* Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('hrAnalytics.turnover.chartTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyLineChart
                    data={turnoverData.map((d) => ({
                      name: d.period.replace('_', ' '),
                      trainingRetention: d.trainingRetentionRate,
                      noTrainingRetention: d.noTrainingRetentionRate,
                      tqcSurvival: d.tqcCompletionSurvivalRate,
                    }))}
                    height={300}
                    lines={[
                      { dataKey: 'trainingRetention', name: t('hrAnalytics.turnover.trainedLine'), stroke: '#22c55e', strokeWidth: 2 },
                      { dataKey: 'noTrainingRetention', name: t('hrAnalytics.turnover.untrainedLine'), stroke: '#ef4444', strokeWidth: 2 },
                      { dataKey: 'tqcSurvival', name: t('hrAnalytics.turnover.tqcLine'), stroke: '#3b82f6', strokeWidth: 2, type: 'monotone' },
                    ]}
                    xAxisKey="name"
                  />
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('hrAnalytics.turnover.period')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.turnover.totalResignations')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.turnover.withTraining')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.turnover.withoutTraining')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.turnover.trainedRetentionShort')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.turnover.untrainedRetentionShort')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.turnover.avgHoursResigned')}</TableHead>
                        <TableHead className="text-right">{t('hrAnalytics.turnover.avgHoursRetained')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {turnoverData.map((row) => (
                        <TableRow key={row.period}>
                          <TableCell className="font-medium">{row.period.replace('_', ' ')}</TableCell>
                          <TableCell className="text-right">{row.totalResignations}</TableCell>
                          <TableCell className="text-right">{row.resignedWithTraining}</TableCell>
                          <TableCell className="text-right">{row.resignedWithoutTraining}</TableCell>
                          <TableCell className="text-right text-green-600">{row.trainingRetentionRate}%</TableCell>
                          <TableCell className="text-right text-red-600">{row.noTrainingRetentionRate}%</TableCell>
                          <TableCell className="text-right">{row.avgTrainingHoursResigned}h</TableCell>
                          <TableCell className="text-right">{row.avgTrainingHoursRetained}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

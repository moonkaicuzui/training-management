import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Plus,
  Target,
  Users,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart3,
  Download,
  Edit,
  AlertTriangle,
  Clock,
  TrendingUp,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '@/stores/trainingStore';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import * as api from '@/services/api';
import type { AnnualPlan } from '@/services/trainingPlanService';

// 월별 캘린더 뷰 컴포넌트
function MonthlyCalendarView({ plan }: { plan: AnnualPlan }) {
  const { t } = useTranslation();
  const months = [
    t('trainingPlan.months.jan'), t('trainingPlan.months.feb'), t('trainingPlan.months.mar'),
    t('trainingPlan.months.apr'), t('trainingPlan.months.may'), t('trainingPlan.months.jun'),
    t('trainingPlan.months.jul'), t('trainingPlan.months.aug'), t('trainingPlan.months.sep'),
    t('trainingPlan.months.oct'), t('trainingPlan.months.nov'), t('trainingPlan.months.dec'),
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {months.map((month, idx) => {
        const monthNum = idx + 1;
        const programsInMonth = plan.planned_programs.filter(p =>
          p.scheduled_months?.includes(monthNum)
        );
        const currentMonth = new Date().getMonth() + 1;
        const isPast = plan.year < new Date().getFullYear() ||
          (plan.year === new Date().getFullYear() && monthNum < currentMonth);
        const isCurrent = plan.year === new Date().getFullYear() && monthNum === currentMonth;

        return (
          <Card
            key={month}
            className={`p-2 ${isCurrent ? 'ring-2 ring-primary' : ''} ${isPast ? 'opacity-60' : ''}`}
          >
            <div className="text-center">
              <p className={`text-sm font-medium ${isCurrent ? 'text-primary' : ''}`}>{month}</p>
              <p className="text-2xl font-bold">{programsInMonth.length}</p>
              <p className="text-xs text-muted-foreground">{t('trainingPlan.status.scheduled')}</p>
            </div>
            {programsInMonth.length > 0 && (
              <div className="mt-2 space-y-1">
                {programsInMonth.slice(0, 2).map((prog) => (
                  <Badge key={prog.program_code} variant="outline" className="text-xs w-full justify-start truncate">
                    {prog.program_name}
                  </Badge>
                ))}
                {programsInMonth.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">+{programsInMonth.length - 2}{t('trainingPlan.countUnit')}</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// 계획 상세 다이얼로그
function PlanDetailDialog({
  open,
  onClose,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  plan: AnnualPlan | null;
}) {
  const { t } = useTranslation();
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  if (!plan) return null;

  const toggleProgram = (code: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedPrograms(newExpanded);
  };

  const totalStats = plan.planned_programs.reduce(
    (acc, prog) => ({
      sessions: acc.sessions + prog.planned_sessions,
      participants: acc.participants + prog.target_participants,
      actualSessions: acc.actualSessions + prog.actual_sessions,
      actualParticipants: acc.actualParticipants + prog.actual_participants,
    }),
    { sessions: 0, participants: 0, actualSessions: 0, actualParticipants: 0 }
  );

  const overallProgress = totalStats.sessions > 0
    ? Math.round((totalStats.actualSessions / totalStats.sessions) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {plan.plan_name}
          </DialogTitle>
          <DialogDescription>
            {t('trainingPlan.year')}: {plan.year} | {t('common.status')}: {
              plan.status === 'DRAFT' ? t('trainingPlan.status.draft') :
              plan.status === 'APPROVED' ? t('trainingPlan.status.approved') :
              plan.status === 'IN_PROGRESS' ? t('trainingPlan.status.inProgress') : t('trainingPlan.status.completed')
            }
          </DialogDescription>
        </DialogHeader>

        {/* 전체 진행률 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('trainingPlan.overallProgress')}</span>
              <span className="text-sm font-bold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualSessions}/{totalStats.sessions}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.completedPlannedSessions')}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualParticipants}/{totalStats.participants}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.completedTargetParticipants')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 월별 캘린더 */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t('trainingPlan.monthlySchedule')}</h4>
          <MonthlyCalendarView plan={plan} />
        </div>

        {/* 프로그램별 상세 */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t('trainingPlan.programPlan')}</h4>
          <div className="space-y-2">
            {plan.planned_programs.map((prog) => {
              const isExpanded = expandedPrograms.has(prog.program_code);

              return (
                <Collapsible key={prog.program_code} open={isExpanded} onOpenChange={() => toggleProgram(prog.program_code)}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <div className="text-left">
                              <p className="font-medium">{prog.program_name}</p>
                              <p className="text-xs text-muted-foreground">{prog.program_code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={
                              prog.priority === 'HIGH' ? 'destructive' :
                              prog.priority === 'MEDIUM' ? 'warning' : 'secondary'
                            }>
                              {prog.priority === 'HIGH' ? t('trainingPlan.priority.high') : prog.priority === 'MEDIUM' ? t('trainingPlan.priority.medium') : t('trainingPlan.priority.low')}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-bold">{prog.completion_rate}%</p>
                              <p className="text-xs text-muted-foreground">{t('trainingPlan.completionRate')}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3 px-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.plannedSessions')}</p>
                            <p className="font-bold">{prog.planned_sessions}{t('trainingPlan.sessionUnit')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.completedSessions')}</p>
                            <p className="font-bold">{prog.actual_sessions}{t('trainingPlan.sessionUnit')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.targetParticipants')}</p>
                            <p className="font-bold">{prog.target_participants}{t('trainingPlan.personUnit')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.actualParticipants')}</p>
                            <p className="font-bold">{prog.actual_participants}{t('trainingPlan.personUnit')}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">{t('trainingPlan.scheduledMonths')}</p>
                          <div className="flex flex-wrap gap-1">
                            {prog.scheduled_months?.map((month) => {
                              const monthKeys = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
                              return (
                                <Badge key={month} variant="outline" className="text-xs">
                                  {t(`trainingPlan.months.${monthKeys[month - 1]}`)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        {prog.budget && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.budget')}</p>
                            <p className="font-medium">{prog.budget.toLocaleString()}{t('trainingPlan.currencyUnit')}</p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 품질 지표 요약 컴포넌트
function QualityMetricsSummary({
  retrainingCount,
  expiringCount,
  passRate,
  onViewRetraining,
}: {
  retrainingCount: number;
  expiringCount: number;
  passRate: number;
  onViewRetraining: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {t('trainingPlan.qualityManagementStatus')}
        </CardTitle>
        <CardDescription>
          {t('trainingPlan.qualityMetricsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{retrainingCount}</p>
              <p className="text-xs text-muted-foreground">{t('trainingPlan.retrainingNeeded')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{expiringCount}</p>
              <p className="text-xs text-muted-foreground">{t('trainingPlan.expiringWithin30Days')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{passRate}%</p>
              <p className="text-xs text-muted-foreground">{t('trainingPlan.overallPassRate')}</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button variant="outline" size="sm" onClick={onViewRetraining} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('trainingPlan.linkRetrainingPlan')}
            </Button>
          </div>
        </div>

        {retrainingCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{t('trainingPlan.caution')}:</span>
              {t('trainingPlan.retrainingWarning', { count: retrainingCount })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 부서별 교육 현황 컴포넌트
function DepartmentTrainingStatus({ departments }: { departments: Array<{ name: string; total: number; completed: number; rate: number }> }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('trainingPlan.departmentTrainingStatus')}
        </CardTitle>
        <CardDescription>
          {t('trainingPlan.departmentAnnualStatus')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments.map((dept) => (
            <div key={dept.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{dept.name}</span>
                <span className="text-muted-foreground">
                  {dept.completed}/{dept.total}{t('trainingPlan.personUnit')} ({dept.rate}%)
                </span>
              </div>
              <Progress value={dept.rate} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 프로그램별 품질 현황 컴포넌트
function ProgramQualityStatus({ programs }: { programs: Array<{ code: string; name: string; sessions: number; passRate: number; retrainingNeeded: number }> }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('trainingPlan.programQualityStatus')}
        </CardTitle>
        <CardDescription>
          {t('trainingPlan.programQualityDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('trainingPlan.program')}</TableHead>
              <TableHead className="text-center">{t('trainingPlan.sessions')}</TableHead>
              <TableHead className="text-center">{t('trainingPlan.passRate')}</TableHead>
              <TableHead className="text-center">{t('trainingPlan.retrainingNeeded')}</TableHead>
              <TableHead className="text-center">{t('common.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((prog) => (
              <TableRow key={prog.code}>
                <TableCell>
                  <div>
                    <p className="font-medium">{prog.name}</p>
                    <p className="text-xs text-muted-foreground">{prog.code}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">{prog.sessions}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={prog.passRate >= 90 ? 'success' : prog.passRate >= 70 ? 'warning' : 'destructive'}>
                    {prog.passRate}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {prog.retrainingNeeded > 0 ? (
                    <Badge variant="destructive">{prog.retrainingNeeded}{t('trainingPlan.personUnit')}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {prog.passRate >= 90 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                  ) : prog.passRate >= 70 ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function TrainingPlanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Store 연동
  const {
    retrainingTargets,
    expiringTrainings,
    dashboardStats,
    programs,
    fetchRetrainingTargets,
    fetchExpiringTrainings,
    fetchDashboardStats,
    fetchPrograms,
  } = useTrainingStore(useShallow((state) => ({
    retrainingTargets: state.retrainingTargets,
    expiringTrainings: state.expiringTrainings,
    dashboardStats: state.dashboardStats,
    programs: state.programs,
    fetchRetrainingTargets: state.fetchRetrainingTargets,
    fetchExpiringTrainings: state.fetchExpiringTrainings,
    fetchDashboardStats: state.fetchDashboardStats,
    fetchPrograms: state.fetchPrograms,
  })));

  const [plans, setPlans] = useState<AnnualPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPlan, setSelectedPlan] = useState<AnnualPlan | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: '',
    year: new Date().getFullYear(),
    period: 'YEARLY' as AnnualPlan['period'],
    total_budget: 0,
  });

  // Firebase에서 교육 계획 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getTrainingPlans();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load training plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    Promise.all([
      loadData(),
      fetchRetrainingTargets(),
      fetchExpiringTrainings(30),
      fetchDashboardStats(),
      fetchPrograms(),
    ]).catch(() => {});
  }, [loadData, fetchRetrainingTargets, fetchExpiringTrainings, fetchDashboardStats, fetchPrograms]);

  // 품질 지표 계산
  const qualityMetrics = useMemo(() => {
    const retrainingCount = retrainingTargets?.length ?? 0;
    const expiringCount = expiringTrainings?.length ?? 0;
    const passRate = dashboardStats?.overallCompletionRate ?? 85; // 기본값

    return { retrainingCount, expiringCount, passRate };
  }, [retrainingTargets, expiringTrainings, dashboardStats]);

  // 부서별 교육 현황 (샘플 데이터 - 실제로는 store에서 가져와야 함)
  const departmentStats = useMemo(() => {
    // 재교육 대상자 기준으로 부서별 현황 계산
    const deptMap = new Map<string, { total: number; needsRetraining: number }>();

    retrainingTargets?.forEach((target) => {
      const dept = target.employee?.department ?? 'Unknown';
      const existing = deptMap.get(dept) || { total: 100, needsRetraining: 0 };
      existing.needsRetraining += 1;
      deptMap.set(dept, existing);
    });

    // 기본 부서 목록 (실제로는 employees에서 가져와야 함)
    const defaultDepts = ['생산1팀', '생산2팀', '품질관리팀', 'R&D', '관리팀'];
    return defaultDepts.map((name) => {
      const data = deptMap.get(name) || { total: 50, needsRetraining: 0 };
      const completed = data.total - data.needsRetraining;
      const rate = Math.round((completed / data.total) * 100);
      return { name, total: data.total, completed, rate };
    });
  }, [retrainingTargets]);

  // 프로그램별 품질 현황
  const programQualityStats = useMemo(() => {
    // 재교육 대상자 기준으로 프로그램별 현황 계산
    const progMap = new Map<string, { code: string; name: string; retrainingNeeded: number }>();

    retrainingTargets?.forEach((target) => {
      const code = target.program?.program_code ?? 'Unknown';
      const name = target.program?.program_name ?? 'Unknown';
      const existing = progMap.get(code) || { code, name, retrainingNeeded: 0 };
      existing.retrainingNeeded += 1;
      progMap.set(code, existing);
    });

    // 기존 프로그램 목록과 병합
    const result = programs?.slice(0, 5).map((prog) => {
      const quality = progMap.get(prog.program_code);
      return {
        code: prog.program_code,
        name: prog.program_name ?? prog.program_code,
        sessions: 12,
        passRate: quality?.retrainingNeeded ? Math.max(70, 95 - quality.retrainingNeeded * 5) : 95,
        retrainingNeeded: quality?.retrainingNeeded ?? 0,
      };
    }) ?? [];

    return result;
  }, [programs, retrainingTargets]);

  // 연도별 계획 필터링
  const filteredPlans = useMemo(() => {
    return plans.filter(plan =>
      selectedYear === 'all' || plan.year.toString() === selectedYear
    );
  }, [plans, selectedYear]);

  // 현재 연도 계획
  const currentYearPlan = plans.find(p => p.year === new Date().getFullYear());

  // 통계
  const stats = useMemo(() => {
    if (!currentYearPlan) return { programs: 0, sessions: 0, participants: 0, progress: 0 };

    const totalSessions = currentYearPlan.planned_programs.reduce((acc, p) => acc + p.planned_sessions, 0);
    const completedSessions = currentYearPlan.planned_programs.reduce((acc, p) => acc + p.actual_sessions, 0);

    return {
      programs: currentYearPlan.planned_programs.length,
      sessions: totalSessions,
      participants: currentYearPlan.planned_programs.reduce((acc, p) => acc + p.target_participants, 0),
      progress: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    };
  }, [currentYearPlan]);

  const handleCreatePlan = async () => {
    if (!formData.plan_name.trim()) return;
    setIsCreating(true);
    try {
      await api.createTrainingPlan({
        plan_name: formData.plan_name,
        year: formData.year,
        period: formData.period,
        status: 'DRAFT',
        planned_programs: [],
        total_budget: formData.total_budget || undefined,
        created_by: user?.email || '',
      });
      setCreateDialogOpen(false);
      setFormData({ plan_name: '', year: new Date().getFullYear(), period: 'YEARLY', total_budget: 0 });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('trainingPlan.createPlanError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDetail = (plan: AnnualPlan) => {
    setSelectedPlan(plan);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('trainingPlan.title')}</h1>
          <p className="text-muted-foreground">{t('trainingPlan.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/retraining')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('trainingPlan.retrainingStatus')}
          </Button>
          <Button onClick={() => { setFormData({ plan_name: '', year: new Date().getFullYear(), period: 'YEARLY', total_budget: 0 }); setCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('trainingPlan.addPlan')}
          </Button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
            <span className="text-muted-foreground">{t('trainingPlan.loadingPlans')}</span>
          </CardContent>
        </Card>
      )}

      {/* 에러 상태 */}
      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 품질 관리 현황 - 품질 부서장을 위한 핵심 지표 */}
      <QualityMetricsSummary
        retrainingCount={qualityMetrics.retrainingCount}
        expiringCount={qualityMetrics.expiringCount}
        passRate={qualityMetrics.passRate}
        onViewRetraining={() => navigate('/retraining')}
      />

      {/* 탭 구조: 계획 개요 / 품질 분석 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Calendar className="h-4 w-4 mr-2" />
            {t('trainingPlan.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="quality">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('trainingPlan.tabs.qualityAnalysis')}
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="h-4 w-4 mr-2" />
            {t('trainingPlan.tabs.departmentStatus')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 금년 계획 요약 */}
      {currentYearPlan && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('trainingPlan.yearPlanStatus', { year: new Date().getFullYear() })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.programs}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.trainingPrograms')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.sessions}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.plannedSessions')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.participants}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.targetParticipants')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <BarChart3 className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.progress}%</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.progressRate')}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{t('trainingPlan.annualProgress')}</span>
                <span className="text-sm font-bold">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-3" />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => handleViewDetail(currentYearPlan)}>
                {t('trainingPlan.viewDetail')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 월별 캘린더 미리보기 */}
      {currentYearPlan && (
        <Card>
          <CardHeader>
            <CardTitle>{t('trainingPlan.monthlySchedule')}</CardTitle>
            <CardDescription>{t('trainingPlan.monthlyScheduleDescription', { year: new Date().getFullYear() })}</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyCalendarView plan={currentYearPlan} />
          </CardContent>
        </Card>
      )}

      {/* 계획 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('trainingPlan.planList')}</CardTitle>
              <CardDescription>{t('trainingPlan.planListDescription')}</CardDescription>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('trainingPlan.planName')}</TableHead>
                <TableHead>{t('trainingPlan.year')}</TableHead>
                <TableHead>{t('trainingPlan.period')}</TableHead>
                <TableHead>{t('trainingPlan.program')}</TableHead>
                <TableHead>{t('trainingPlan.sessions')}</TableHead>
                <TableHead>{t('trainingPlan.budget')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('trainingPlan.progressRate')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {t('trainingPlan.noPlans')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => {
                  const totalSessions = plan.planned_programs.reduce((acc, p) => acc + p.planned_sessions, 0);
                  const completedSessions = plan.planned_programs.reduce((acc, p) => acc + p.actual_sessions, 0);
                  const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

                  return (
                    <TableRow key={plan.plan_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.plan_name}</p>
                          <p className="text-xs text-muted-foreground">{plan.plan_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{plan.year}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.period === 'YEARLY' ? t('trainingPlan.periodType.yearly') :
                           plan.period === 'QUARTERLY' ? t('trainingPlan.periodType.quarterly') : t('trainingPlan.periodType.monthly')}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.planned_programs.length}</TableCell>
                      <TableCell>{totalSessions}</TableCell>
                      <TableCell>
                        {plan.total_budget ? `${(plan.total_budget / 100000000).toFixed(1)}${t('trainingPlan.hundredMillionUnit')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          plan.status === 'COMPLETED' ? 'success' :
                          plan.status === 'IN_PROGRESS' ? 'default' :
                          plan.status === 'APPROVED' ? 'secondary' : 'outline'
                        }>
                          {plan.status === 'DRAFT' ? t('trainingPlan.status.draft') :
                           plan.status === 'APPROVED' ? t('trainingPlan.status.approved') :
                           plan.status === 'IN_PROGRESS' ? t('trainingPlan.status.inProgress') : t('trainingPlan.status.completed')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-16 h-2" />
                          <span className="text-sm">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(plan)}>
                            {t('common.detail')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('trainingPlan.editPlan')}
                            onClick={() => handleViewDetail(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        {/* 품질 분석 탭 */}
        <TabsContent value="quality" className="space-y-6">
          <ProgramQualityStatus programs={programQualityStats} />

          {/* 재교육 필요 인원 상세 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                {t('trainingPlan.retrainingDetailTitle')}
              </CardTitle>
              <CardDescription>
                {t('trainingPlan.retrainingDetailDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retrainingTargets && retrainingTargets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('trainingPlan.employeeName')}</TableHead>
                      <TableHead>{t('trainingPlan.department')}</TableHead>
                      <TableHead>{t('trainingPlan.program')}</TableHead>
                      <TableHead>{t('common.score')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retrainingTargets.slice(0, 10).map((target, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {target.employee?.employee_name ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{target.employee?.department ?? '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{target.program?.program_name ?? '-'}</p>
                            <p className="text-xs text-muted-foreground">{target.program?.program_code ?? '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {target.lastResult?.score ?? 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            {t('trainingPlan.retrainingNeeded')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">{t('trainingPlan.noRetrainingTargets')}</p>
                  <p className="text-sm">{t('trainingPlan.allEmployeesCompleted')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 만료 임박 교육 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                {t('trainingPlan.expiringTrainingTitle')}
              </CardTitle>
              <CardDescription>
                {t('trainingPlan.expiringTrainingDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringTrainings && expiringTrainings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('trainingPlan.employeeName')}</TableHead>
                      <TableHead>{t('trainingPlan.department')}</TableHead>
                      <TableHead>{t('trainingPlan.program')}</TableHead>
                      <TableHead>{t('trainingPlan.expirationDate')}</TableHead>
                      <TableHead>{t('trainingPlan.daysRemaining')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringTrainings.slice(0, 10).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.employee?.employee_name ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.employee?.department ?? '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{item.program?.program_name ?? '-'}</p>
                            <p className="text-xs text-muted-foreground">{item.program?.program_code ?? '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.daysUntilExpiry <= 7 ? 'destructive' : 'warning'}>
                            D-{item.daysUntilExpiry ?? '?'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">{t('trainingPlan.noExpiringTraining')}</p>
                  <p className="text-sm">{t('trainingPlan.noExpiringTrainingDesc')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 부서별 현황 탭 */}
        <TabsContent value="departments" className="space-y-6">
          <DepartmentTrainingStatus departments={departmentStats} />

          {/* 부서별 상세 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('trainingPlan.departmentCompletionDetail')}</CardTitle>
              <CardDescription>
                {t('trainingPlan.departmentCompletionDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('trainingPlan.department')}</TableHead>
                    <TableHead className="text-center">{t('trainingPlan.totalEmployees')}</TableHead>
                    <TableHead className="text-center">{t('trainingPlan.completedCount')}</TableHead>
                    <TableHead className="text-center">{t('trainingPlan.incompleteCount')}</TableHead>
                    <TableHead className="text-center">{t('trainingPlan.completionRate')}</TableHead>
                    <TableHead className="text-center">{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((dept) => (
                    <TableRow key={dept.name}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-center">{dept.total}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {dept.completed}
                      </TableCell>
                      <TableCell className="text-center text-red-600 font-medium">
                        {dept.total - dept.completed}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={dept.rate} className="w-16 h-2" />
                          <span className="text-sm font-medium">{dept.rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {dept.rate >= 95 ? (
                          <Badge variant="success">{t('trainingPlan.rating.excellent')}</Badge>
                        ) : dept.rate >= 80 ? (
                          <Badge variant="secondary">{t('trainingPlan.rating.good')}</Badge>
                        ) : dept.rate >= 60 ? (
                          <Badge variant="warning">{t('trainingPlan.rating.caution')}</Badge>
                        ) : (
                          <Badge variant="destructive">{t('trainingPlan.rating.poor')}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 권고사항 */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                {t('trainingPlan.qualityManagerRecommendations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {departmentStats.filter(d => d.rate < 80).map((dept) => (
                  <li key={dept.name} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>
                      {t('trainingPlan.recommendation.belowTarget', { dept: dept.name, rate: dept.rate })}
                    </span>
                  </li>
                ))}
                {qualityMetrics.retrainingCount > 0 && (
                  <li className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>
                      {t('trainingPlan.recommendation.includeRetraining', { count: qualityMetrics.retrainingCount })}
                    </span>
                  </li>
                )}
                {qualityMetrics.expiringCount > 0 && (
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>
                      {t('trainingPlan.recommendation.expiringTraining', { count: qualityMetrics.expiringCount })}
                    </span>
                  </li>
                )}
                {departmentStats.every(d => d.rate >= 80) && qualityMetrics.retrainingCount === 0 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      {t('trainingPlan.recommendation.allTargetsMet')}
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 계획 상세 다이얼로그 */}
      <PlanDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        plan={selectedPlan}
      />

      {/* 새 계획 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('trainingPlan.addPlan')}
            </DialogTitle>
            <DialogDescription>
              {t('trainingPlan.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="plan_name">{t('trainingPlan.planName')} *</Label>
              <Input
                id="plan_name"
                placeholder={t('trainingPlan.planNamePlaceholder')}
                value={formData.plan_name}
                onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">{t('trainingPlan.year')}</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(v) => setFormData(prev => ({ ...prev, year: parseInt(v) }))}
              >
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">{t('trainingPlan.quarter')}</Label>
              <Select
                value={formData.period}
                onValueChange={(v) => setFormData(prev => ({ ...prev, period: v as AnnualPlan['period'] }))}
              >
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YEARLY">{t('trainingPlan.periodType.yearly')}</SelectItem>
                  <SelectItem value="QUARTERLY">{t('trainingPlan.periodType.quarterly')}</SelectItem>
                  <SelectItem value="MONTHLY">{t('trainingPlan.periodType.monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_budget">{t('trainingPlan.budgetLabel')}</Label>
              <Input
                id="total_budget"
                type="number"
                min={0}
                placeholder="0"
                value={formData.total_budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, total_budget: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreatePlan} disabled={isCreating || !formData.plan_name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

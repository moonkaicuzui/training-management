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
                  <p className="text-xs text-muted-foreground text-center">+{programsInMonth.length - 2}개</p>
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
              <span className="text-sm font-medium">전체 진행률</span>
              <span className="text-sm font-bold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualSessions}/{totalStats.sessions}</p>
                <p className="text-xs text-muted-foreground">완료/계획 세션</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualParticipants}/{totalStats.participants}</p>
                <p className="text-xs text-muted-foreground">완료/목표 인원</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 월별 캘린더 */}
        <div>
          <h4 className="text-sm font-medium mb-3">월별 교육 일정</h4>
          <MonthlyCalendarView plan={plan} />
        </div>

        {/* 프로그램별 상세 */}
        <div>
          <h4 className="text-sm font-medium mb-3">프로그램별 계획</h4>
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
                              {prog.priority === 'HIGH' ? '높음' : prog.priority === 'MEDIUM' ? '보통' : '낮음'}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-bold">{prog.completion_rate}%</p>
                              <p className="text-xs text-muted-foreground">완료율</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3 px-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">계획 세션</p>
                            <p className="font-bold">{prog.planned_sessions}회</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">완료 세션</p>
                            <p className="font-bold">{prog.actual_sessions}회</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">목표 인원</p>
                            <p className="font-bold">{prog.target_participants}명</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">실제 참여</p>
                            <p className="font-bold">{prog.actual_participants}명</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">예정 월</p>
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
                            <p className="text-xs text-muted-foreground">예산</p>
                            <p className="font-medium">{prog.budget.toLocaleString()}원</p>
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
  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          품질 관리 현황 (Quality Management Status)
        </CardTitle>
        <CardDescription>
          생산계획 수립 시 고려해야 할 품질 지표
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
              <p className="text-xs text-muted-foreground">재교육 필요</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{expiringCount}</p>
              <p className="text-xs text-muted-foreground">만료 임박 (30일)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{passRate}%</p>
              <p className="text-xs text-muted-foreground">전체 합격률</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button variant="outline" size="sm" onClick={onViewRetraining} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              재교육 계획 연계
            </Button>
          </div>
        </div>

        {retrainingCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">주의:</span>
              재교육 대상자 {retrainingCount}명이 있습니다. 연간 계획에 재교육 세션을 포함하세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 부서별 교육 현황 컴포넌트
function DepartmentTrainingStatus({ departments }: { departments: Array<{ name: string; total: number; completed: number; rate: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          부서별 교육 현황
        </CardTitle>
        <CardDescription>
          부서별 연간 교육 이수 현황
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments.map((dept) => (
            <div key={dept.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{dept.name}</span>
                <span className="text-muted-foreground">
                  {dept.completed}/{dept.total}명 ({dept.rate}%)
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          프로그램별 품질 현황
        </CardTitle>
        <CardDescription>
          교육 프로그램별 합격률 및 재교육 현황
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>프로그램</TableHead>
              <TableHead className="text-center">세션</TableHead>
              <TableHead className="text-center">합격률</TableHead>
              <TableHead className="text-center">재교육 필요</TableHead>
              <TableHead className="text-center">상태</TableHead>
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
                    <Badge variant="destructive">{prog.retrainingNeeded}명</Badge>
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
  const { user } = useAuthStore();

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
  } = useTrainingStore();

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
    loadData();
    fetchRetrainingTargets();
    fetchExpiringTrainings(30);
    fetchDashboardStats();
    fetchPrograms();
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
      setError(err instanceof Error ? err.message : '계획 생성 실패');
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
            재교육 현황
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
            <span className="text-muted-foreground">교육 계획을 불러오는 중...</span>
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
              다시 시도
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
            계획 개요
          </TabsTrigger>
          <TabsTrigger value="quality">
            <TrendingUp className="h-4 w-4 mr-2" />
            품질 분석
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="h-4 w-4 mr-2" />
            부서별 현황
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 금년 계획 요약 */}
      {currentYearPlan && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {new Date().getFullYear()}년 교육 계획 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.programs}</p>
                <p className="text-xs text-muted-foreground">교육 프로그램</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.sessions}</p>
                <p className="text-xs text-muted-foreground">계획 세션</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.participants}</p>
                <p className="text-xs text-muted-foreground">목표 인원</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <BarChart3 className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.progress}%</p>
                <p className="text-xs text-muted-foreground">진행률</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">연간 진행률</span>
                <span className="text-sm font-bold">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-3" />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => handleViewDetail(currentYearPlan)}>
                상세 보기
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
            <CardTitle>월별 교육 일정</CardTitle>
            <CardDescription>{new Date().getFullYear()}년 월별 교육 예정 현황</CardDescription>
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
              <CardTitle>교육 계획 목록</CardTitle>
              <CardDescription>연도별 교육 계획 관리</CardDescription>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="2025">2025년</SelectItem>
                <SelectItem value="2024">2024년</SelectItem>
                <SelectItem value="2023">2023년</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>계획명</TableHead>
                <TableHead>연도</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>프로그램</TableHead>
                <TableHead>세션</TableHead>
                <TableHead>예산</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>진행률</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    등록된 교육 계획이 없습니다
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
                      <TableCell>{plan.year}년</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.period === 'YEARLY' ? '연간' :
                           plan.period === 'QUARTERLY' ? '분기' : '월간'}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.planned_programs.length}개</TableCell>
                      <TableCell>{totalSessions}회</TableCell>
                      <TableCell>
                        {plan.total_budget ? `${(plan.total_budget / 100000000).toFixed(1)}억` : '-'}
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
                            상세
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="교육 계획 수정"
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
                재교육 필요 인원 상세
              </CardTitle>
              <CardDescription>
                불합격 또는 만료로 인한 재교육 대상자 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retrainingTargets && retrainingTargets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>직원명</TableHead>
                      <TableHead>부서</TableHead>
                      <TableHead>프로그램</TableHead>
                      <TableHead>점수</TableHead>
                      <TableHead>상태</TableHead>
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
                            재교육 필요
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">재교육 대상자가 없습니다</p>
                  <p className="text-sm">모든 직원이 교육을 정상적으로 이수했습니다</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 만료 임박 교육 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                만료 임박 교육 (30일 이내)
              </CardTitle>
              <CardDescription>
                유효기간 만료가 임박한 교육 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringTrainings && expiringTrainings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>직원명</TableHead>
                      <TableHead>부서</TableHead>
                      <TableHead>프로그램</TableHead>
                      <TableHead>만료일</TableHead>
                      <TableHead>남은 일수</TableHead>
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
                  <p className="font-medium">만료 임박 교육이 없습니다</p>
                  <p className="text-sm">30일 이내 만료 예정인 교육이 없습니다</p>
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
              <CardTitle className="text-base">부서별 교육 이수 상세</CardTitle>
              <CardDescription>
                부서별 교육 프로그램 이수 현황
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>부서</TableHead>
                    <TableHead className="text-center">총원</TableHead>
                    <TableHead className="text-center">이수 완료</TableHead>
                    <TableHead className="text-center">미이수</TableHead>
                    <TableHead className="text-center">이수율</TableHead>
                    <TableHead className="text-center">상태</TableHead>
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
                          <Badge variant="success">우수</Badge>
                        ) : dept.rate >= 80 ? (
                          <Badge variant="secondary">양호</Badge>
                        ) : dept.rate >= 60 ? (
                          <Badge variant="warning">주의</Badge>
                        ) : (
                          <Badge variant="destructive">미흡</Badge>
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
                품질 부서장 권고사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {departmentStats.filter(d => d.rate < 80).map((dept) => (
                  <li key={dept.name} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>{dept.name}</strong>의 이수율이 {dept.rate}%로 목표(80%) 미달입니다.
                      추가 교육 세션을 계획하세요.
                    </span>
                  </li>
                ))}
                {qualityMetrics.retrainingCount > 0 && (
                  <li className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>
                      재교육 대상자 <strong>{qualityMetrics.retrainingCount}명</strong>에 대한
                      재교육 일정을 연간 계획에 포함하세요.
                    </span>
                  </li>
                )}
                {qualityMetrics.expiringCount > 0 && (
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>{qualityMetrics.expiringCount}건</strong>의 교육이 30일 내 만료됩니다.
                      갱신 교육을 계획하세요.
                    </span>
                  </li>
                )}
                {departmentStats.every(d => d.rate >= 80) && qualityMetrics.retrainingCount === 0 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      모든 부서가 목표 이수율을 달성했습니다. 현재 교육 계획을 유지하세요.
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
              <Label htmlFor="plan_name">계획명 *</Label>
              <Input
                id="plan_name"
                placeholder="예: 2025년 연간 교육 계획"
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
                    <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
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
                  <SelectItem value="YEARLY">연간</SelectItem>
                  <SelectItem value="QUARTERLY">분기</SelectItem>
                  <SelectItem value="MONTHLY">월간</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_budget">예산 (만원)</Label>
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

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Plus,
  TrendingUp,
  Building2,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '@/stores/trainingStore';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import * as api from '@/services/api';
import type { AnnualPlan } from '@/services/trainingPlanService';

// Extracted components
import {
  OverviewTabContent,
  DepartmentsTabContent,
} from '@/components/training-plan/TrainingPlanCalendar';
import type { DepartmentStat, QualityMetrics } from '@/components/training-plan/TrainingPlanCalendar';
import {
  QualityMetricsSummary,
  QualityTabContent,
} from '@/components/training-plan/TrainingPlanTable';
import type { ProgramQualityStat } from '@/components/training-plan/TrainingPlanTable';
import {
  PlanDetailDialog,
  CreatePlanDialog,
} from '@/components/training-plan/TrainingPlanDialogs';
import type { CreatePlanFormData } from '@/components/training-plan/TrainingPlanDialogs';

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
  const [formData, setFormData] = useState<CreatePlanFormData>({
    plan_name: '',
    year: new Date().getFullYear(),
    period: 'YEARLY',
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
  const qualityMetrics: QualityMetrics = useMemo(() => {
    const retrainingCount = retrainingTargets?.length ?? 0;
    const expiringCount = expiringTrainings?.length ?? 0;
    const passRate = dashboardStats?.overallCompletionRate ?? 85;
    return { retrainingCount, expiringCount, passRate };
  }, [retrainingTargets, expiringTrainings, dashboardStats]);

  // 부서별 교육 현황
  const departmentStats: DepartmentStat[] = useMemo(() => {
    const deptMap = new Map<string, { total: number; needsRetraining: number }>();
    retrainingTargets?.forEach((target) => {
      const dept = target.employee?.department ?? 'Unknown';
      const existing = deptMap.get(dept) || { total: 100, needsRetraining: 0 };
      existing.needsRetraining += 1;
      deptMap.set(dept, existing);
    });
    const defaultDepts = [
      t('trainingPlan.deptProduction1'),
      t('trainingPlan.deptProduction2'),
      t('trainingPlan.deptQuality'),
      t('trainingPlan.deptRnD'),
      t('trainingPlan.deptAdmin'),
    ];
    return defaultDepts.map((name) => {
      const data = deptMap.get(name) || { total: 50, needsRetraining: 0 };
      const completed = data.total - data.needsRetraining;
      const rate = Math.round((completed / data.total) * 100);
      return { name, total: data.total, completed, rate };
    });
  }, [retrainingTargets]);

  // 프로그램별 품질 현황
  const programQualityStats: ProgramQualityStat[] = useMemo(() => {
    const progMap = new Map<string, { code: string; name: string; retrainingNeeded: number }>();
    retrainingTargets?.forEach((target) => {
      const code = target.program?.program_code ?? 'Unknown';
      const name = target.program?.program_name ?? 'Unknown';
      const existing = progMap.get(code) || { code, name, retrainingNeeded: 0 };
      existing.retrainingNeeded += 1;
      progMap.set(code, existing);
    });
    return programs?.slice(0, 5).map((prog) => {
      const quality = progMap.get(prog.program_code);
      return {
        code: prog.program_code,
        name: prog.program_name ?? prog.program_code,
        sessions: 12,
        passRate: quality?.retrainingNeeded ? Math.max(70, 95 - quality.retrainingNeeded * 5) : 95,
        retrainingNeeded: quality?.retrainingNeeded ?? 0,
      };
    }) ?? [];
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

      {/* 품질 관리 현황 */}
      <QualityMetricsSummary
        retrainingCount={qualityMetrics.retrainingCount}
        expiringCount={qualityMetrics.expiringCount}
        passRate={qualityMetrics.passRate}
        onViewRetraining={() => navigate('/retraining')}
      />

      {/* 탭 구조 */}
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
          <OverviewTabContent
            currentYearPlan={currentYearPlan}
            stats={stats}
            filteredPlans={filteredPlans}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            onViewDetail={handleViewDetail}
          />
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <QualityTabContent
            programQualityStats={programQualityStats}
            retrainingTargets={retrainingTargets}
            expiringTrainings={expiringTrainings}
          />
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <DepartmentsTabContent
            departmentStats={departmentStats}
            qualityMetrics={qualityMetrics}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PlanDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        plan={selectedPlan}
      />

      <CreatePlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleCreatePlan}
        isCreating={isCreating}
      />
    </div>
  );
}

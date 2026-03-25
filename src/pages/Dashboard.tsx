import { useEffect, useMemo, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Plus,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIAnomalyBadge } from '@/components/dashboard/KPIAnomalyBadge';
import { HRSummaryCards } from '@/components/dashboard/HRSummaryCards';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardRetrainingTable } from '@/components/dashboard/DashboardRetrainingTable';
import { DashboardBuildingChart } from '@/components/dashboard/DashboardBuildingChart';
import { DashboardExpiringCard } from '@/components/dashboard/DashboardExpiringCard';
import { useKPIAnomalies } from '@/hooks/useKPIAnomalies';
import { useNormalizedTrainingStore } from '@/stores';
import { checkAndCreateExpiryNotifications } from '@/services/api';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { getCurrentHRSummary, syncCurrentHRSummary } from '@/services/api';
import type { HRSummary } from '@/services/api';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    derived,
    loading,
    fetchDashboardStats,
    fetchMonthlyData,
    fetchGradeDistribution,
    fetchRetrainingTargets,
    fetchExpiringTrainings,
  } = useNormalizedTrainingStore(useShallow((s) => ({
    derived: s.derived,
    loading: s.loading,
    fetchDashboardStats: s.fetchDashboardStats,
    fetchMonthlyData: s.fetchMonthlyData,
    fetchGradeDistribution: s.fetchGradeDistribution,
    fetchRetrainingTargets: s.fetchRetrainingTargets,
    fetchExpiringTrainings: s.fetchExpiringTrainings,
  })));

  const dashboardStats = derived.dashboard.stats;
  const monthlyData = derived.dashboard.monthlyData;
  const gradeDistribution = derived.dashboard.gradeDistribution;
  const retrainingTargets = derived.retraining.targets;
  const expiringTrainings = derived.retraining.expiring;

  const currentKPIs = useMemo<Record<string, number> | null>(() => {
    if (!dashboardStats) return null;
    return {
      overallCompletionRate: dashboardStats.overallCompletionRate ?? 0,
      retrainingCount: dashboardStats.retrainingCount ?? 0,
      totalEmployees: dashboardStats.totalEmployees ?? 0,
      monthlyCompletions: dashboardStats.monthlyCompletions ?? 0,
    };
  }, [dashboardStats]);
  const { anomalies } = useKPIAnomalies(currentKPIs);

  const anomalyByField: Record<string, typeof anomalies[0]> = {};
  for (const a of anomalies) {
    anomalyByField[a.field] = a;
  }

  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // HR V2 연동 상태
  const [hrData, setHrData] = useState<HRSummary | null>(null);
  const [hrLoading, setHrLoading] = useState(true);
  const [hrSyncing, setHrSyncing] = useState(false);

  const handleHRSync = useCallback(async () => {
    setHrSyncing(true);
    try {
      const data = await syncCurrentHRSummary();
      if (data) setHrData(data);
    } catch (err) {
      logger.error('[Dashboard] HR 동기화 실패:', err);
    } finally {
      setHrSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (isDataLoaded) return;

    const loadData = async () => {
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchMonthlyData(),
          fetchGradeDistribution(),
          fetchRetrainingTargets(),
          fetchExpiringTrainings(30),
        ]);
        setIsDataLoaded(true);
      } catch (err) {
        logger.error('Dashboard data fetch error:', err);
        setError('messages.loadError');
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HR V2 데이터 로드 (별도 effect - 메인 대시보드 로딩을 차단하지 않음)
  useEffect(() => {
    let cancelled = false;
    const loadHR = async () => {
      try {
        const data = await getCurrentHRSummary();
        if (!cancelled) {
          setHrData(data);
        }
      } catch (err) {
        logger.warn('[Dashboard] HR 데이터 로드 실패 (비차단):', err);
      } finally {
        if (!cancelled) {
          setHrLoading(false);
        }
      }
    };
    loadHR();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;

    const STORAGE_KEY = 'q-train-last-expiry-check';
    const lastCheck = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().substring(0, 10);

    if (lastCheck === today) return;

    checkAndCreateExpiryNotifications()
      .then((count) => {
        localStorage.setItem(STORAGE_KEY, today);
        if (count > 0) {
          logger.info(`[Dashboard] Created ${count} certification expiry notifications`);
        }
      })
      .catch((err) => {
        logger.error('[Dashboard] Expiry notification check failed:', err);
      });
  }, [isDataLoaded]);

  if (loading.views.dashboard) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{t(error)}</p>
        <Button onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const completionSparkline = monthlyData.map((m) => m.completed);
  const plannedSparkline = monthlyData.map((m) => m.planned);

  const kpiCards = [
    {
      title: t('dashboard.totalEmployees'),
      value: dashboardStats?.totalEmployees ?? 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/employees',
      trend: null as number | null,
      sparklineData: undefined as number[] | undefined,
      anomalyField: 'totalEmployees',
    },
    {
      title: t('dashboard.monthlyCompletions'),
      value: dashboardStats?.monthlyCompletions ?? 0,
      icon: GraduationCap,
      color: 'text-status-pass',
      bgColor: 'bg-status-pass/10',
      link: '/results',
      trend: null as number | null,
      sparklineData: completionSparkline.length > 1 ? completionSparkline : undefined,
      anomalyField: 'monthlyCompletions',
    },
    {
      title: t('dashboard.completionRate'),
      value: `${dashboardStats?.overallCompletionRate ?? 0}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/results',
      trend: null as number | null,
      sparklineData: plannedSparkline.length > 1 ? plannedSparkline : undefined,
      anomalyField: 'overallCompletionRate',
    },
    {
      title: t('dashboard.retrainingNeeded'),
      value: dashboardStats?.retrainingCount ?? 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      link: '/retraining',
      trend: null as number | null,
      sparklineData: undefined as number[] | undefined,
      anomalyField: 'retrainingCount',
    },
  ];

  return (
    <div className="space-y-6" aria-label={t('common.aria.dashboard')}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/schedule')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.newTraining')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/results')}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {t('dashboard.enterResults')}
          </Button>
        </div>
      </div>

      <section aria-label={t('common.aria.kpiSection')}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((stat, index) => (
            <div key={index} className="relative">
              <KPICard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                bgColor={stat.bgColor}
                link={stat.link}
                trend={stat.trend}
                sparklineData={stat.sparklineData}
              />
              {anomalyByField[stat.anomalyField] && (
                <div className="absolute top-2 right-2">
                  <KPIAnomalyBadge anomaly={anomalyByField[stat.anomalyField]} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-label={t('dashboard.hr.title')}>
        <HRSummaryCards
          hrData={hrData}
          isLoading={hrLoading}
          onSync={handleHRSync}
          isSyncing={hrSyncing}
        />
      </section>

      <DashboardCharts monthlyData={monthlyData} gradeDistribution={gradeDistribution} />

      <DashboardRetrainingTable targets={retrainingTargets} />

      <DashboardBuildingChart
        retrainingTargets={retrainingTargets}
        expiringTrainings={expiringTrainings}
      />

      <DashboardExpiringCard expiringTrainings={expiringTrainings} />
    </div>
  );
}

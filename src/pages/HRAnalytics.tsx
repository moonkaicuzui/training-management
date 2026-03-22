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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  analyzeTrainingEffectiveness,
  getHighRiskTrainingRecommendations,
  getNewHireTrainingStatus,
  compareQualityData,
  getDepartmentTrainingRates,
  analyzeTurnoverTrainingCorrelation,
} from '@/services/api';
import type {
  TrainingEffectivenessResult,
  RiskBasedRecommendation,
  NewHireTrainingStatus,
  QualitySync,
  DepartmentTrainingRate,
  TurnoverTrainingCorrelation,
} from '@/services/api';
import { MonthYearSelector, DEFAULT_MONTH, DEFAULT_YEAR } from '@/components/hr/HRHelperComponents';
import EffectivenessTab from '@/components/hr/EffectivenessTab';
import RiskTab from '@/components/hr/RiskTab';
import NewHireTab from '@/components/hr/NewHireTab';
import QualityTab from '@/components/hr/QualityTab';
import DepartmentTab from '@/components/hr/DepartmentTab';
import TurnoverTab from '@/components/hr/TurnoverTab';

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

        <TabsContent value="effectiveness">
          <EffectivenessTab data={effectivenessData} loading={effectivenessLoading} onLoad={loadEffectiveness} />
        </TabsContent>

        <TabsContent value="risk">
          <RiskTab data={riskData} loading={riskLoading} onLoad={loadRisk} />
        </TabsContent>

        <TabsContent value="newHire">
          <NewHireTab data={newHireData} loading={newHireLoading} onLoad={loadNewHire} />
        </TabsContent>

        <TabsContent value="quality">
          <QualityTab data={qualityData} loading={qualityLoading} onLoad={loadQuality} />
        </TabsContent>

        <TabsContent value="department">
          <DepartmentTab data={deptData} loading={deptLoading} onLoad={loadDept} />
        </TabsContent>

        <TabsContent value="turnover">
          <TurnoverTab data={turnoverData} loading={turnoverLoading} onLoad={loadTurnover} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

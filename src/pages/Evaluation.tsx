import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import type { AqlEnrollmentLog } from '@/types/aql';
import * as api from '@/services/api';
import {
  calculateEffectiveness,
  type EffectivenessResult,
} from '@/utils/trainingEffectiveness';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { EvaluationHeader } from '@/components/evaluation/EvaluationHeader';
import { EvaluationStatsCards } from '@/components/evaluation/EvaluationStatsCards';
import EvaluationFilters from '@/components/evaluation/EvaluationFilters';
import EvaluationTable from '@/components/evaluation/EvaluationTable';
import {
  EvaluationDetailDialog,
  NewEvaluationDialog,
} from '@/components/evaluation/EvaluationDetailDialog';
import {
  OverviewTab,
  ProgramsTab,
  CriteriaTab,
  EffectivenessTab,
} from '@/components/evaluation/EvaluationCharts';
import { getTypeLabel, getStatusLabel } from '@/components/evaluation/helpers';
import type { ProgramStats } from '@/components/evaluation/types';

export default function Evaluation() {
  const { t } = useTranslation();

  const [evaluations, setEvaluations] = useState<TrainingEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvaluation, setSelectedEvaluation] = useState<TrainingEvaluation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewEvaluationDialog, setShowNewEvaluationDialog] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [newEvalForm, setNewEvalForm] = useState({
    programCode: '',
    type: '' as string,
    sessionId: '',
    deadline: '',
    message: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const [effectivenessResults, setEffectivenessResults] = useState<EffectivenessResult[]>([]);
  const [isLoadingEffectiveness, setIsLoadingEffectiveness] = useState(false);

  // ─── Data Loading ───────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateEvaluation = async () => {
    if (!newEvalForm.programCode || !newEvalForm.type) {
      setError(t('evaluation.requiredFieldsError'));
      return;
    }
    setIsCreating(true);
    try {
      await api.createEvaluation({
        id: `eval-${Date.now()}`,
        programId: newEvalForm.programCode,
        programName: '',
        sessionId: newEvalForm.sessionId || '',
        sessionDate: '',
        employeeId: '',
        employeeName: '',
        department: '',
        evaluationType: newEvalForm.type as 'reaction' | 'learning' | 'behavior' | 'results',
        responses: [],
        overallScore: 0,
        feedback: newEvalForm.message || '',
        status: 'pending',
      });
      setShowNewEvaluationDialog(false);
      setNewEvalForm({ programCode: '', type: '', sessionId: '', deadline: '', message: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.saveFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const loadEffectivenessData = useCallback(async () => {
    if (effectivenessResults.length > 0) return;
    setIsLoadingEffectiveness(true);
    try {
      const [enrollmentLogs, trainingResults] = await Promise.all([
        api.getAqlEnrollmentLogs(),
        api.getResults(),
      ]);

      const resultMap = new Map<string, { score: number | null; result: string; date: string }>();
      for (const r of trainingResults) {
        const key = `${r.employee_id}__${r.program_code}`;
        const existing = resultMap.get(key);
        if (!existing || r.created_at > existing.date) {
          resultMap.set(key, { score: r.score, result: r.result, date: r.created_at });
        }
      }

      const enrollmentMap = new Map<string, AqlEnrollmentLog>();
      for (const log of enrollmentLogs) {
        const key = `${log.employee_id}__${log.program_code}`;
        const existing = enrollmentMap.get(key);
        if (!existing || log.enrolled_at < existing.enrolled_at) {
          enrollmentMap.set(key, log);
        }
      }

      const results: EffectivenessResult[] = [];
      const processedKeys = new Set<string>();

      for (const log of enrollmentLogs) {
        const key = `${log.employee_id}__${log.program_code}`;
        if (processedKeys.has(key)) continue;
        processedKeys.add(key);

        const allLogs = enrollmentLogs
          .filter(
            (l) => l.employee_id === log.employee_id && l.program_code === log.program_code
          )
          .sort((a, b) => a.enrolled_at.localeCompare(b.enrolled_at));

        if (allLogs.length < 1 || !allLogs[0].fail_rate) continue;

        const beforeFailRate = allLogs[0].fail_rate * 100;
        let afterFailRate: number;

        if (allLogs.length >= 2) {
          afterFailRate = allLogs[allLogs.length - 1].fail_rate * 100;
        } else {
          const trainingResult = resultMap.get(key);
          if (trainingResult && trainingResult.result === 'PASS') {
            afterFailRate = beforeFailRate * 0.5;
          } else {
            continue;
          }
        }

        const effectiveness = calculateEffectiveness(beforeFailRate, afterFailRate);

        results.push({
          employeeId: allLogs[0].employee_id,
          employeeName: allLogs[0].employee_name,
          programCode: allLogs[0].program_code,
          programName: allLogs[0].program_name,
          beforeFailRate: Math.round(beforeFailRate * 100) / 100,
          afterFailRate: Math.round(afterFailRate * 100) / 100,
          ...effectiveness,
          enrolledAt: allLogs[0].enrolled_at,
        });
      }

      setEffectivenessResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.loadFailed'));
    } finally {
      setIsLoadingEffectiveness(false);
    }
  }, [effectivenessResults.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'effectiveness') {
      loadEffectivenessData();
    }
  }, [activeTab, loadEffectivenessData]);

  // ─── Computed Data ──────────────────────────────────────

  const programStats = useMemo((): ProgramStats[] => {
    const statsMap = new Map<string, {
      programId: string;
      programName: string;
      scores: number[];
      types: Record<string, number[]>;
    }>();

    evaluations.forEach((e) => {
      if (!statsMap.has(e.programId)) {
        statsMap.set(e.programId, {
          programId: e.programId,
          programName: e.programName,
          scores: [],
          types: { reaction: [], learning: [], behavior: [], results: [] },
        });
      }
      const stat = statsMap.get(e.programId)!;
      stat.scores.push(e.overallScore);
      if (stat.types[e.evaluationType]) {
        stat.types[e.evaluationType].push(e.overallScore);
      }
    });

    return Array.from(statsMap.values()).map((s) => {
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      return {
        programId: s.programId,
        programName: s.programName,
        totalEvaluations: s.scores.length,
        averageScore: Math.round(avg(s.scores) * 10) / 10,
        completionRate: Math.round((s.scores.filter(sc => sc >= 60).length / Math.max(s.scores.length, 1)) * 100),
        reactionScore: Math.round(avg(s.types.reaction) * 10) / 10,
        learningScore: Math.round(avg(s.types.learning) * 10) / 10,
        behaviorScore: Math.round(avg(s.types.behavior) * 10) / 10,
        resultsScore: Math.round(avg(s.types.results) * 10) / 10,
      };
    });
  }, [evaluations]);

  const overallEffectivenessStats = useMemo(() => {
    if (effectivenessResults.length === 0) {
      return { totalEmployees: 0, avgImprovement: 0, significantCount: 0, noneCount: 0 };
    }
    const totalImprovement = effectivenessResults.reduce((sum, r) => sum + r.improvementPercent, 0);
    return {
      totalEmployees: effectivenessResults.length,
      avgImprovement: Math.round((totalImprovement / effectivenessResults.length) * 100) / 100,
      significantCount: effectivenessResults.filter((r) => r.rating === 'significant').length,
      noneCount: effectivenessResults.filter((r) => r.rating === 'none').length,
    };
  }, [effectivenessResults]);

  const filteredEvaluations = evaluations.filter(e => {
    const matchesSearch =
      e.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || e.evaluationType === selectedType;
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // ─── Statistics ─────────────────────────────────────────

  const totalEvaluations = evaluations.length;
  const submittedCount = evaluations.filter(e => e.status !== 'pending').length;
  const averageScore = totalEvaluations > 0 ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / totalEvaluations : 0;
  const pendingCount = evaluations.filter(e => e.status === 'pending').length;

  // ─── Handlers ─────────────────────────────────────────

  const handleExportExcel = async () => {
    const exportData = filteredEvaluations.map(e => ({
      [t('evaluation.exportId')]: e.id,
      [t('evaluation.programCol')]: e.programName,
      [t('evaluation.exportTrainingDate')]: e.sessionDate,
      [t('evaluation.participantCol')]: e.employeeName,
      [t('evaluation.departmentCol')]: e.department,
      [t('evaluation.exportType')]: getTypeLabel(t, e.evaluationType),
      [t('evaluation.exportAvgScore')]: e.overallScore,
      [t('evaluation.statusCol')]: getStatusLabel(t, e.status),
      [t('evaluation.submittedDate')]: e.submittedAt.split('T')[0],
      [t('evaluation.exportFeedback')]: e.feedback,
    }));

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('evaluation.sheetName'));
    XLSX.writeFile(wb, `training_evaluations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleViewDetails = (evaluation: TrainingEvaluation) => {
    setSelectedEvaluation(evaluation);
    setShowDetailDialog(true);
  };

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <EvaluationHeader
        onExportExcel={handleExportExcel}
        onNewEvaluation={() => setShowNewEvaluationDialog(true)}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <EvaluationStatsCards
        totalEvaluations={totalEvaluations}
        submittedCount={submittedCount}
        averageScore={averageScore}
        pendingCount={pendingCount}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('evaluation.overviewTab')}</TabsTrigger>
          <TabsTrigger value="evaluations">{t('evaluation.evaluationsTab')}</TabsTrigger>
          <TabsTrigger value="programs">{t('evaluation.programsTab')}</TabsTrigger>
          <TabsTrigger value="criteria">{t('evaluation.criteriaTab')}</TabsTrigger>
          <TabsTrigger value="effectiveness">{t('evaluation.effectivenessTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab evaluations={evaluations} programStats={programStats} />
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <EvaluationFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedType={selectedType}
            onSelectedTypeChange={setSelectedType}
            selectedStatus={selectedStatus}
            onSelectedStatusChange={setSelectedStatus}
          />
          <EvaluationTable
            evaluations={filteredEvaluations}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <ProgramsTab
            programStats={programStats}
            expandedProgram={expandedProgram}
            onExpandedProgramChange={setExpandedProgram}
          />
        </TabsContent>

        <TabsContent value="criteria" className="space-y-4">
          <CriteriaTab evaluations={evaluations} />
        </TabsContent>

        <TabsContent value="effectiveness" className="space-y-4">
          <EffectivenessTab
            isLoading={isLoadingEffectiveness}
            effectivenessResults={effectivenessResults}
            overallStats={overallEffectivenessStats}
          />
        </TabsContent>
      </Tabs>

      <EvaluationDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        evaluation={selectedEvaluation}
      />

      <NewEvaluationDialog
        open={showNewEvaluationDialog}
        onOpenChange={setShowNewEvaluationDialog}
        form={newEvalForm}
        onFormChange={setNewEvalForm}
        onSubmit={handleCreateEvaluation}
        isCreating={isCreating}
      />
    </div>
  );
}

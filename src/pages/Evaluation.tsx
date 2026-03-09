import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import type { AqlEnrollmentLog } from '@/types/aql';
import * as api from '@/services/api';
import * as aqlService from '@/services/aqlService';
import {
  calculateEffectiveness,
  type EffectivenessResult,
} from '@/utils/trainingEffectiveness';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  TrendingUp,
  Users,
  FileText,
  Download,
  Plus,
} from 'lucide-react';

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

// ─── UI-only types ──────────────────────────────────────────

interface ProgramStats {
  programId: string;
  programName: string;
  totalEvaluations: number;
  averageScore: number;
  completionRate: number;
  reactionScore: number;
  learningScore: number;
  behaviorScore: number;
  resultsScore: number;
}

export default function Evaluation() {
  const { t } = useTranslation();

  // Core data
  const [evaluations, setEvaluations] = useState<TrainingEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // UI state
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

  // Training effectiveness state
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
      setError(err instanceof Error ? err.message : 'Failed to load evaluations');
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
      setError(err instanceof Error ? err.message : 'Failed to create evaluation');
    } finally {
      setIsCreating(false);
    }
  };

  const loadEffectivenessData = useCallback(async () => {
    if (effectivenessResults.length > 0) return;
    setIsLoadingEffectiveness(true);
    try {
      const [enrollmentLogs, trainingResults] = await Promise.all([
        aqlService.getAqlEnrollmentLogs(),
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
      setError(err instanceof Error ? err.message : 'Failed to load effectiveness data');
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

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTypeLabel = (type: TrainingEvaluation['evaluationType']) => {
    const labels: Record<string, string> = {
      reaction: t('evaluation.typeReaction'),
      learning: t('evaluation.typeLearning'),
      behavior: t('evaluation.typeBehavior'),
      results: t('evaluation.typeResults'),
    };
    return labels[type];
  };

  const getStatusLabel = (status: TrainingEvaluation['status']) => {
    const labels: Record<string, string> = {
      pending: t('evaluation.statusPending'),
      submitted: t('evaluation.statusSubmitted'),
      reviewed: t('evaluation.statusReviewed'),
    };
    return labels[status];
  };

  const handleExportExcel = async () => {
    const exportData = filteredEvaluations.map(e => ({
      [t('evaluation.exportId')]: e.id,
      [t('evaluation.programCol')]: e.programName,
      [t('evaluation.exportTrainingDate')]: e.sessionDate,
      [t('evaluation.participantCol')]: e.employeeName,
      [t('evaluation.departmentCol')]: e.department,
      [t('evaluation.exportType')]: getTypeLabel(e.evaluationType),
      [t('evaluation.exportAvgScore')]: e.overallScore,
      [t('evaluation.statusCol')]: getStatusLabel(e.status),
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('evaluation.title')}</h1>
          <p className="text-muted-foreground">
            {t('evaluation.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            {t('evaluation.exportExcel')}
          </Button>
          <Button onClick={() => setShowNewEvaluationDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('evaluation.newEvaluation')}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
            {t('common.retry', '재시도')}
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('evaluation.totalEvaluations')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.submittedCount', { count: submittedCount })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('evaluation.avgScore')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)} / 5.0
            </div>
            <Progress value={(averageScore / 5) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('evaluation.responseRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEvaluations > 0 ? Math.round((submittedCount / totalEvaluations) * 100) : 0}%
            </div>
            <Progress
              value={totalEvaluations > 0 ? (submittedCount / totalEvaluations) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('evaluation.pending')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.pendingCount')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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

      {/* Dialogs */}
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

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import {
  type EffectivenessResult,
  type ProgramEffectivenessSummary,
  type EffectivenessChartData,
  getRatingBadgeVariant,
  summarizeByProgram,
  toChartData,
} from '@/utils/trainingEffectiveness';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import {
  BarChart3,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Users,
  Activity,
} from 'lucide-react';

// ─── Shared Helpers ─────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 4.5) return 'text-green-600';
  if (score >= 3.5) return 'text-blue-600';
  if (score >= 2.5) return 'text-yellow-600';
  return 'text-red-600';
}

function renderStars(score: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className={`ml-2 font-medium ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
    </div>
  );
}

// ─── Shared Types ───────────────────────────────────────────

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

// ─── Overview Tab Content ───────────────────────────────────

interface OverviewTabProps {
  evaluations: TrainingEvaluation[];
  programStats: ProgramStats[];
}

export function OverviewTab({ evaluations, programStats }: OverviewTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Kirkpatrick Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('evaluation.kirkpatrickTitle')}
            </CardTitle>
            <CardDescription>
              {t('evaluation.kirkpatrickDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {([
                { type: 'reaction', icon: <ThumbsUp className="h-4 w-4 text-blue-500" />, label: t('evaluation.level1') },
                { type: 'learning', icon: <BarChart3 className="h-4 w-4 text-green-500" />, label: t('evaluation.level2') },
                { type: 'behavior', icon: <TrendingUp className="h-4 w-4 text-yellow-500" />, label: t('evaluation.level3') },
                { type: 'results', icon: <Award className="h-4 w-4 text-purple-500" />, label: t('evaluation.level4') },
              ] as const).map(level => {
                const levelEvals = evaluations.filter(e => e.evaluationType === level.type);
                const levelAvg = levelEvals.length > 0
                  ? levelEvals.reduce((sum, e) => sum + e.overallScore, 0) / levelEvals.length
                  : 0;
                return (
                  <div key={level.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {level.icon}
                      <span>{level.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{levelAvg > 0 ? levelAvg.toFixed(1) : '-'}</span>
                      <Progress value={levelAvg > 0 ? (levelAvg / 5) * 100 : 0} className="w-20" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('evaluation.recentEvaluations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{e.programName}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.employeeName} · {e.department}
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStars(e.overallScore)}
                    <p className="text-xs text-muted-foreground">
                      {e.submittedAt.split('T')[0]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top/Bottom Programs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              {t('evaluation.topPrograms')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {programStats
                .sort((a, b) => b.averageScore - a.averageScore)
                .slice(0, 3)
                .map((p, idx) => (
                  <div key={p.programId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{idx + 1}</span>
                      <span>{p.programName}</span>
                    </div>
                    {renderStars(p.averageScore)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              {t('evaluation.needsImprovement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {programStats
                .sort((a, b) => a.averageScore - b.averageScore)
                .slice(0, 3)
                .map((p, idx) => (
                  <div key={p.programId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{idx + 1}</span>
                      <span>{p.programName}</span>
                    </div>
                    {renderStars(p.averageScore)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Programs Tab Content ───────────────────────────────────

interface ProgramsTabProps {
  programStats: ProgramStats[];
  expandedProgram: string | null;
  onExpandedProgramChange: (programId: string | null) => void;
}

export function ProgramsTab({ programStats, expandedProgram, onExpandedProgramChange }: ProgramsTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('evaluation.programAnalysis')}</CardTitle>
        <CardDescription>
          {t('evaluation.programAnalysisDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {programStats.map((program) => (
            <div key={program.programId} className="border rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => onExpandedProgramChange(
                  expandedProgram === program.programId ? null : program.programId
                )}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{program.programName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('evaluation.evaluationCount', { count: program.totalEvaluations, rate: program.completionRate })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {renderStars(program.averageScore)}
                  {expandedProgram === program.programId ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
              {expandedProgram === program.programId && (
                <div className="border-t p-4 bg-muted/20">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <ThumbsUp className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.reaction')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.reactionScore)}`}>
                        {program.reactionScore || '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <BarChart3 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.learning')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.learningScore)}`}>
                        {program.learningScore || '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.behavior')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.behaviorScore)}`}>
                        {program.behaviorScore || '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <Award className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.results')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.resultsScore)}`}>
                        {program.resultsScore || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Criteria Tab Content ───────────────────────────────────

interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
}

const evaluationCriteria: EvaluationCriteria[] = [
  { id: 'c1', name: '교육 내용 적합성', weight: 20, description: '업무와의 관련성 및 실용성' },
  { id: 'c2', name: '강사 전문성', weight: 20, description: '강사의 지식과 전달력' },
  { id: 'c3', name: '교육 자료 품질', weight: 15, description: '교재 및 자료의 품질' },
  { id: 'c4', name: '교육 환경', weight: 10, description: '시설 및 장비 상태' },
  { id: 'c5', name: '학습 목표 달성', weight: 20, description: '교육 목표 달성 정도' },
  { id: 'c6', name: '업무 적용 가능성', weight: 15, description: '실제 업무 적용 가능성' },
];

interface CriteriaTabProps {
  evaluations: TrainingEvaluation[];
}

export function CriteriaTab({ evaluations }: CriteriaTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('evaluation.criteriaManagement')}</CardTitle>
        <CardDescription>
          {t('evaluation.criteriaManagementDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('evaluation.criteriaItem')}</TableHead>
              <TableHead>{t('evaluation.criteriaDescription')}</TableHead>
              <TableHead>{t('evaluation.criteriaWeight')}</TableHead>
              <TableHead>{t('evaluation.criteriaAvgScore')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluationCriteria.map((criteria) => {
              const criteriaScores = evaluations
                .flatMap(e => e.responses || [])
                .filter(r => r.criteriaId === criteria.id)
                .map(r => r.score);
              const avgScore = criteriaScores.length > 0
                ? criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length
                : 0;
              return (
                <TableRow key={criteria.id}>
                  <TableCell className="font-medium">{criteria.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {criteria.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={criteria.weight} className="w-20" />
                      <span>{criteria.weight}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{avgScore > 0 ? renderStars(avgScore) : <span className="text-muted-foreground">-</span>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Effectiveness Tab Content ──────────────────────────────

interface EffectivenessTabProps {
  isLoading: boolean;
  effectivenessResults: EffectivenessResult[];
  overallStats: {
    totalEmployees: number;
    avgImprovement: number;
    significantCount: number;
    noneCount: number;
  };
}

export function EffectivenessTab({
  isLoading,
  effectivenessResults,
  overallStats,
}: EffectivenessTabProps) {
  const { t } = useTranslation();

  const programEffectivenessSummaries = useMemo((): ProgramEffectivenessSummary[] => {
    return summarizeByProgram(effectivenessResults);
  }, [effectivenessResults]);

  const effectivenessChartData = useMemo((): EffectivenessChartData[] => {
    return toChartData(programEffectivenessSummaries);
  }, [programEffectivenessSummaries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (effectivenessResults.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('evaluation.effectiveness.noData')}</p>
            <p className="text-sm mt-1">{t('evaluation.effectiveness.noDataDesc')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Effectiveness Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.measuredEmployees')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.effectiveness.measuredDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.avgImprovement')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallStats.avgImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallStats.avgImprovement > 0 ? '+' : ''}
              {overallStats.avgImprovement}%
            </div>
            <Progress
              value={Math.min(Math.max(overallStats.avgImprovement, 0), 100)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.significantImprovement')}
            </CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallStats.significantCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.effectiveness.significantDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.effectiveness.noImprovement')}
            </CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overallStats.noneCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.effectiveness.noImprovementDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Program Effectiveness Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('evaluation.effectiveness.programSummaryTitle')}
          </CardTitle>
          <CardDescription>
            {t('evaluation.effectiveness.programSummaryDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {effectivenessChartData.length > 0 && (
            <div className="mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('evaluation.effectiveness.programCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.employeeCountCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.beforeCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.afterCol')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.effectiveness.improvementCol')}</TableHead>
                    <TableHead>{t('evaluation.effectiveness.ratingCol')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programEffectivenessSummaries.map((summary) => (
                    <TableRow key={summary.programCode}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{summary.programName}</p>
                          <p className="text-sm text-muted-foreground">{summary.programCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{summary.employeeCount}</TableCell>
                      <TableCell className="text-right">{summary.avgBeforeFailRate}%</TableCell>
                      <TableCell className="text-right">{summary.avgAfterFailRate}%</TableCell>
                      <TableCell className="text-right">
                        <span className={summary.avgImprovementPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                          {summary.avgImprovementPercent > 0 ? '+' : ''}
                          {summary.avgImprovementPercent}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRatingBadgeVariant(summary.rating)}>
                          {t(`evaluation.effectiveness.rating_${summary.rating}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Employee Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('evaluation.effectiveness.individualTitle')}
          </CardTitle>
          <CardDescription>
            {t('evaluation.effectiveness.individualDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('evaluation.effectiveness.employeeCol')}</TableHead>
                <TableHead>{t('evaluation.effectiveness.programCol')}</TableHead>
                <TableHead className="text-right">{t('evaluation.effectiveness.beforeCol')}</TableHead>
                <TableHead className="text-right">{t('evaluation.effectiveness.afterCol')}</TableHead>
                <TableHead className="text-right">{t('evaluation.effectiveness.improvementCol')}</TableHead>
                <TableHead>{t('evaluation.effectiveness.ratingCol')}</TableHead>
                <TableHead>{t('evaluation.effectiveness.enrolledDateCol')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {effectivenessResults.slice(0, 50).map((result, idx) => (
                <TableRow key={`${result.employeeId}-${result.programCode}-${idx}`}>
                  <TableCell className="font-medium">{result.employeeName}</TableCell>
                  <TableCell>
                    <div>
                      <p>{result.programName}</p>
                      <p className="text-xs text-muted-foreground">{result.programCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{result.beforeFailRate}%</TableCell>
                  <TableCell className="text-right">{result.afterFailRate}%</TableCell>
                  <TableCell className="text-right">
                    <span className={result.improvementPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                      {result.improvementPercent > 0 ? '+' : ''}
                      {result.improvementPercent}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRatingBadgeVariant(result.rating)}>
                      {t(`evaluation.effectiveness.rating_${result.rating}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {result.enrolledAt.split('T')[0]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
